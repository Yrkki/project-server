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

  // console.log('json.js: Requesting:', req.url);
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
  // console.log('fetch', currentPath, req.url);

  const url = decodeURI(currentPath + req.url);

  const protocol = currentPath.startsWith('https') ? https : http;
  protocol.get(url, (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
      // console.log("Data:", chunk.length);
      data += chunk;
    });
    resp.on('end', () => {
      // console.log("End.");
      respond(req, currentPath, res, data);
    });
  }).on("error", (err) => {
    // console.log("Error:", err.message);
  });
}

function load(req, currentPath, res) {
  // console.log('load', currentPath, req.url);

  const key = decodeURI(path.join(__dirname, '..', currentPath, req.url));

  const data = fs.readFileSync(key);
  respond(req, currentPath, res, data);
}

function respond(req, currentPath, res, data) {
  // console.log('respond', req.url);

  try {
    data = JSON.parse(data);
  } catch (error) {
    data = {};
  }

  if (process.env.CV_GENERATOR_PROJECT_SERVER_ENCRYPTER === 'decrypt') {
    data = encrypter.decrypt(data);

    data = preprocessWhenNeeded(data, req.url);

    const contentType = req.url.endsWith('.json') ? 'application/json' : data.ContentType;
    // console.log('contentType: ', contentType);
    res.setHeader('Content-Type', contentType);

    cacheControl.setCacheControl(res);

    obfuscator.obfuscateWhenNeeded(currentPath, data).then((data) => {
      res.send(data);
    });
  } else {
    data = encrypter.encrypt(data);
    res.send(data);
  }
}

function preprocessWhenNeeded(data, key) {
  // console.log('Preprocessing:', key);

  switch (key) {
    case '/ui.json':
      try { data.Disclaimer.text = data.Disclaimer.text.join(' '); }
      catch (e) { }
      break;

    case '/projects.json':
      data = JSON.parse(JSON.stringify(data).replaceAll('"0"', '""').replaceAll('"n/a"', '""'));

      for (const iterator of data) {
        iterator.Reference = iterator.Reference
          .split(', ')
          .map(reference => {
            var ref = reference.indexOf(' ');
            return ref > 0 ? reference.substr(0, reference.indexOf(' ')) : reference;
          })
          .join(', ');
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
