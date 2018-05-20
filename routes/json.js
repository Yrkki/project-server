const express = require('express');
const router = express.Router();
const path = require('path');

const obfuscator = require('../javascripts/obfuscator');
const cacheControl = require('../javascripts/cacheControl');

const http = require('http');
const https = require('https');

router.get(/.*/, function (req, res, next) {
  const routePath = '/json';

  // console.log('Requesting:', req.url);
  allowCors(req, res);
  if (req.url.length > 1) {
    const location = req.app.get('location');

    const currentPath = location + routePath;
    const url = currentPath + req.url;

    if (location.startsWith('http')) {
      fetch(url, req, currentPath, res);

    } else {
      const key = decodeURI(path.join('..', url));

      // console.log('Getting:', key);
      const data = require(key);

      respond(data, req, currentPath, res);
    }
  } else {
    res.redirect('/');
  }
});

module.exports = router;

function fetch(url, req, currentPath, res) {
  // console.log('Fetching:', url);
  const protocol = currentPath.startsWith('https') ? https : http;
  protocol.get(url, (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
      // console.log("Data:", chunk.length);
      data += chunk;
    });
    resp.on('end', () => {
      // console.log("End.");
      respond(data, req, currentPath, res);
    });
  }).on("error", (err) => {
    // console.log("Error:", err.message);
  });
}

function respond(data, req, currentPath, res) {
  data = preprocessWhenNeeded(data, req.url);

  obfuscator.obfuscateWhenNeeded(currentPath, data).then((data) => {
    const contentType = req.url.endsWith('.json') ? 'application/json' : data.ContentType;
    // console.log('contentType: ', contentType);
    res.setHeader('Content-Type', contentType);

    cacheControl.setCacheControl(res);
    res.send(data);
  });
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
      break;

    case '/cv.json':
      data = JSON.parse(JSON.stringify(data).replaceAll('Certified', 'CERTIFIED'));
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
