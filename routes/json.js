const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const encrypter = require('../javascripts/encrypter');
const obfuscator = require('../javascripts/obfuscator');
const cacheControl = require('../javascripts/cacheControl');

const http = require('http');
const https = require('https');

router.get(/.*/, function (req, res, next) {
  const routePath = '/json';

  console.debug('json.js: router.get: Requesting:', req.url);
  allowCors(req, res);
  if (req.url.length > 1) {
    const currentPath = req.app.get('location') + routePath;
    if (currentPath.startsWith('http')) {
      fetch(req, currentPath, res);
    } else {
      load(req, currentPath, res);
    }
  } else {
    res.redirect('/');
  }
});

module.exports = router;

function fetch(req, currentPath, res) {
  console.debug('json.js: fetch: ', currentPath, req.url);

  const url = decodeURI(currentPath + req.url);

  const protocol = currentPath.startsWith('https') ? https : http;
  protocol.get(url, (resp) => {
    console.info(`json.js: fetch: resp.statusCode: ${resp.statusCode}`);
    if (resp.statusCode >= 300 && resp.statusCode < 400) {
      // respond(req, currentPath, res, 'There was a redirect.');
      res.redirect(resp.headers.location);
    } else {
      let data = '';
      resp.on('data', (chunk) => {
        console.debug("json.js: Data: chunk length:", chunk.length);
        data += chunk;
      });
      resp.on('end', () => {
        console.debug("json.js: End.");
        respond(req, currentPath, res, data);
      });
    }
  }).on("error", (error) => {
    console.error(`json.js: ${error.message}`);
  });
}

function load(req, currentPath, res) {
  console.debug('json.js: load: ', currentPath, req.url);

  const key = decodeURI(path.join(__dirname, '..', currentPath, req.url));

  const data = fs.readFileSync(key);
  respond(req, currentPath, res, data);
}

function respond(req, currentPath, res, data) {
  console.debug('json.js: respond: ', req.url);

  try {
    // prep amd json package text data like e.g. redirect info message
    if (!data.startsWith('{')) {
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
    console.error(`json.js: respond: message: ${error.message}, data: ${data}`);
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
}

function resSendData(req, currentPath, res, data) {
  data = preprocessWhenNeeded(data, req.url);

  const contentType = req.url.endsWith('.json') ? 'application/json' : data.ContentType;
  console.debug('json.js: resSendData: contentType: ', contentType);
  res.setHeader('Content-Type', contentType);

  cacheControl.setCacheControl(res);

  obfuscator.obfuscateWhenNeeded(currentPath, data).then((data) => {
    res.send(data);
  });
}

function preprocessWhenNeeded(data, key) {
  console.debug('json.js: preprocessWhenNeeded: Preprocessing:', key);

  switch (key) {
    case '/ui.json':
      try {
        // format multiline text data
        data.Disclaimer.text = data.Disclaimer.text.join(' ');
      }
      catch (e) {
        console.error(`json.js: preprocessWhenNeeded: Gave up formatting multiline text data`);
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
        console.error(`json.js: preprocessWhenNeeded: Gave up preparing special data`);
      }
      break;

    default:
      break;
  }

  return data;
}

String.prototype.replaceAll = function (search, replacement) {
  const target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

function allowCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
}
