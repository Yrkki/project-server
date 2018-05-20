const express = require('express');
const router = express.Router();
const path = require('path');

const obfuscator = require('../javascripts/obfuscator');
const cacheControl = require('../javascripts/cacheControl');

router.get(/.*/, function (req, res, next) {
  const routePath = '';

  // console.log('Requesting:', req.url);
  allowCors(req, res);
  if (req.url.length > 1) {
    const location = req.app.get('location');

    const currentPath = location + routePath;
    const url = currentPath + req.url;

    if (currentPath.startsWith('http')) {
      fetch(url, req, currentPath, res);

    } else {
      const key = decodeURI(path.join('..', url));

      // console.log('Getting:', key);
      const data = require(key);

      respond(data, req, currentPath, res);
    }
  } else {
    res.render('index', { title: req.app.get('appName') });
  }
});

module.exports = router;

function fetch(url, req, currentPath, res) {
  // console.log('Redirecting to:', url);
  res.redirect(url);
}

function respond(data, req, currentPath, res) {
  cacheControl.setCacheControl(res);
  res.send(data);
}

function allowCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
}
