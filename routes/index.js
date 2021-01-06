const express = require('express');
const router = express.Router();
const path = require('path');

const obfuscator = require('../javascripts/obfuscator');
const cacheControl = require('../javascripts/cacheControl');

router.get(/.*/, function (req, res, next) {
  const routePath = '';

  console.debug('index.js: router.get: Requesting:', req.url);
  allowCors(req, res);
  if (req.url.length > 1) {
    const currentPath = req.app.get('location') + routePath;
    if (currentPath.startsWith('http')) {
      fetch(req, currentPath, res);
    } else {
      load(req, currentPath, res);
    }
  } else {
    res.render('index', { title: req.app.get('appName') });
  }
});

module.exports = router;

function fetch(req, currentPath, res) {
  console.debug('index.js: fetch: ', currentPath, req.url);

  const url = decodeURI(currentPath + req.url);

  res.redirect(url);
}

function load(req, currentPath, res) {
  console.debug('index.js: load: ', currentPath, req.url);

  const key = decodeURI(path.join(__dirname, '..', currentPath, req.url));

  respond(req, currentPath, res, key);
}

function respond(req, currentPath, res, key) {
  console.debug('index.js: respond: ', key);

  cacheControl.setCacheControl(res);
  res.sendFile(key);
}

function allowCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
}
