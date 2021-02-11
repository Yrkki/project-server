const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mime = require('mime-types')

const encrypter = require('../javascripts/encrypter');
const obfuscator = require('../javascripts/obfuscator');

const cacheControl = require('../javascripts/cacheControl');
const errorHandler = require('../errorHandler');
const http = require('http');
const https = require('https');

// serve GET request
router.get(/.*/, function (req, res, next) {
  const routePath = '/json';

  console.debug(`json.js: router.get: Requesting: req.url: {$req.url}`);
  allowCors(req, res);
  if (req.url.length > 1) {
    const currentPath = req.app.get('location') + routePath;
    if (currentPath.startsWith('http')) {
      fetch(req, currentPath, res, next);
    } else {
      load(req, currentPath, res);
    }
  } else {
    res.redirect('/');
  }
});

/**
 * Fetch via http(s).
 */

function fetch(req, currentPath, res, next) {
  console.debug(`json.js: fetch: currentPath: ${currentPath}, req.url: ${req.url}`);

  const url = currentPath + req.url;
  follow(url, req, currentPath, res, next);
};

/**
 * Follow using the proper protocol.
 */

function follow(url, req, currentPath, res, next) {
  const protocol = url.startsWith('https') ? https : http;
  console.debug(`json.js: follow: https: ${protocol == https}, url: ${url}`);
  protocol.get(url, (resp) => {
    console.debug(`json.js: follow: resp.statusCode: ${resp.statusCode}`);
    if (resp.statusCode >= 300 && resp.statusCode < 400) {

      console.debug(`json.js: follow: redirected: resp.headers.location: ${resp.headers.location}`);
      follow(resp.headers.location, req, currentPath, res, next);

      let data = '';
      resp.on('data', (chunk) => {
        console.debug(`json.js: follow: redirected: Data:
          chunk.length: ${chunk.length},
          chunk: ${chunk.toString()}`);
        data += chunk;
      });
      resp.on('end', () => {
        console.debug(`json.js: follow: End:
          data: ${data}`);
      });
    } else {
      let data = '';
      resp.on('data', (chunk) => {
        console.debug(`json.js: follow: Data: chunk length: ${chunk.length}`);
        data += chunk;
      });
      resp.on('end', () => {
        console.debug(`json.js: follow: End.`);
        respond(req, currentPath, res, data);
      });
    }
  }).on("error", (error) => {
    errorHandler(error, `json.js: follow`);

    // next();
  });
  console.log();
};

/**
 * Load from file system.
 */

function load(req, currentPath, res) {
  console.debug(`json.js: load: currentPath: ${currentPath}, req.url: ${req.url}`);

  const key = decodeURI(path.join(__dirname, currentPath, req.url));

  const data = fs.readFileSync(key);
  respond(req, currentPath, res, data);
};

/**
 * Respond.
 */

function respond(req, currentPath, res, data) {
  console.debug(`json.js: respond: currentPath: ${currentPath}, req.url: ${req.url}`);

  try {
    // prep amd json package text data like e.g. redirect info message
    if (res.statusCode >= 300 && res.statusCode < 400) {
      if (process.env.CV_GENERATOR_PROJECT_SERVER_ENCRYPTER === 'decrypt') {
        data = encrypter.encrypt(data);
      } else if (process.env.CV_GENERATOR_PROJECT_SERVER_ENCRYPTER === 'encrypt') {
        data = encrypter.decrypt(data);
      } else {
      }
      data = JSON.stringify({ data: data });
    }

    // parse json data
    data = JSON.parse(data);
  } catch (error) {
    errorHandler(error, `json.js: respond`);
    console.debug(`data: ${data}`);
    data = {};
  }

  // interpret message and send response
  if (process.env.CV_GENERATOR_PROJECT_SERVER_ENCRYPTER === 'decrypt') {
    data = encrypter.decrypt(data);
    resSendData(req, currentPath, res, data);
  } else if (process.env.CV_GENERATOR_PROJECT_SERVER_ENCRYPTER === 'encrypt') {
    data = encrypter.encrypt(data);
    res.send(data);
  } else {
    resSendData(req, currentPath, res, data);
  }
};

/**
 * Respond by processing and sending the data.
 */

function resSendData(req, currentPath, res, data) {
  data = preprocessWhenNeeded(data, req.url);

  res = adjustContentType(req, res);

  cacheControl.setCacheControl(res);

  obfuscator.obfuscateWhenNeeded(currentPath, data).then((data) => {
    res.send(data);
  });
};

/**
 * Preprocess when needed adapting the data to the client expectations.
 */

function preprocessWhenNeeded(data, key) {
  console.debug(`json.js: preprocessWhenNeeded: Preprocessing: key: ${key}`);

  switch (key) {
    case '/ui.json':
      try {
        // format multiline text data
        data.Disclaimer.text = data.Disclaimer.text.join(' ');
      }
      catch (e) {
        errorHandler(error, `json.js: preprocessWhenNeeded`);
        console.debug(`Gave up formatting multiline text data`);
      }
      break;

    case '/projects.json':
      // clean up falsy data
      data = JSON.parse(JSON.stringify(data).replaceAll('"0"', '""').replaceAll('"n/a"', '""'));

      // console.debug(`json.js: preprocessWhenNeeded: data: ${JSON.stringify(data)}`);

      try {
        // prep special data
        for (const iterator of data) {
          iterator.Reference = iterator.Reference
            .split(', ')
            .map(reference => {
              var ref = reference.indexOf(' ');
              return ref > 0 ? reference.substr(0, reference.indexOf(' ')) : reference;
            })
            .join(', ');
        }
      }
      catch (e) {
        errorHandler(error, `json.js: preprocessWhenNeeded`);
        console.debug(`Gave up preparing special data`);
      }
      break;

    default:
      break;
  }

  return data;
};

/**
 * Adjust content type.
 */

function adjustContentType(req, res) {
  const contentType = mime.contentType(path.parse(req.url).ext);
  if (contentType) {
    console.debug(`json.js: adjustContentType: req.url: ${req.url}, contentType: ${contentType}`);
    res.setHeader('Content-Type', contentType);
  }

  return res;
};

String.prototype.replaceAll = function (search, replacement) {
  const target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

/**
 * Allow CORS.
 */

function allowCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
};

module.exports = router;
