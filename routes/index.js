const express = require('express');
const router = express.Router();
const path = require('path');
const mime = require('mime-types')

const cacheControl = require('../javascripts/cacheControl');
const errorHandler = require('../errorHandler');
const http = require('http');
const https = require('https');

router.get(/.*/, function (req, res, next) {
  const routePath = '';

  console.debug(`index.js: router.get: Requesting: req.url: ${req.url}`);
  allowCors(req, res);
  if (req.url.length > 1) {
    const currentPath = req.app.get('location') + routePath;
    if (currentPath.startsWith('http')) {
      fetch(req, currentPath, res, next);
    } else {
      load(req, currentPath, res);
    }
  } else {
    res.render('index', { title: req.app.get('appName') });
  }
});

/**
 * Fetch via http(s).
 */

function fetch(req, currentPath, res, next) {
  console.debug(`index.js: fetch: currentPath: ${currentPath}, req.url: ${req.url}`);

  const url = currentPath + req.url;
  follow(url, req, currentPath, res, next);
};

/**
 * Follow using the proper protocol.
 */

function follow(url, req, currentPath, res, next) {
  const protocol = url.startsWith('https') ? https : http;
  console.debug(`index.js: follow: https: ${protocol == https}, url: ${url}`);
  protocol.get(url, (resp) => {
    console.debug(`index.js: follow: resp.statusCode: ${resp.statusCode}`);
    if (resp.statusCode >= 300 && resp.statusCode < 400) {

      console.debug(`index.js: follow: redirected: resp.headers.location: ${resp.headers.location}`);
      follow(resp.headers.location, req, currentPath, res, next);

      let data = '';
      resp.on('data', (chunk) => {
        console.debug(`index.js: follow: redirected: Data:
          chunk.length: ${chunk.length},
          chunk: ${chunk.toString()}`);
        data += chunk;
      });
      resp.on('end', () => {
        console.debug(`index.js: follow: End:
          data: ${data}`);
      });
    } else {
      let data = [];
      resp.on('data', (chunk) => {
        // console.debug(`index.js: follow: Data: chunk length: ${chunk.length}`);
        data.push(chunk);
      }).on('end', () => {
        let buffer = Buffer.concat(data);
        console.debug(`index.js: follow: End: total chunk length: ${buffer.length}`);
        // console.log(buffer.toString('base64'));
        resSendData(req, currentPath, res, buffer);
      });
    }
  }).on("error", (error) => {
    errorHandler(error, `index.js: follow`);

    // next();
  });
  console.log();
};

/**
 * Load from file system.
 */

function load(req, currentPath, res) {
  console.debug(`index.js: load: currentPath: ${currentPath}, req.url: ${req.url}`);

  const key = decodeURI(path.join(__dirname, currentPath, req.url));

  respond(req, currentPath, res, key);
};

/**
 * Respond.
 */

function respond(req, currentPath, res, key) {
  console.debug(`index.js: respond: key: ${key}`);

  cacheControl.setCacheControl(res);
  res.sendFile(key);
};

/**
 * Respond by processing and sending the data.
 */

function resSendData(req, currentPath, res, data) {
  res = adjustContentType(req, res);

  cacheControl.setCacheControl(res);
  res.send(data);
};

/**
 * Adjust content type.
 */

function adjustContentType(req, res) {
  const contentType = mime.contentType(path.parse(req.url).ext);
  if (contentType) {
    console.debug(`index.js: adjustContentType: req.url: ${req.url}, contentType: ${contentType}`);
    res.setHeader('Content-Type', contentType);
  }

  return res;
};

/**
 * Allow CORS.
 */

function allowCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
};

module.exports = router;
