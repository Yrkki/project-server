#!/usr/bin/env node

'use strict';

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var cors = require('cors');
var nconf = require('nconf');
var fs = require('fs');
var compression = require('compression');

var indexRouter = require('./routes/index');
var jsonRouter = require('./routes/json');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// set up congifuration
nconf.argv().env();
nconf.file({ file: 'config.json' });
nconf.defaults({
  "appName": "Project Server",
  "appPackageName": "project-server",
  "debug": "false",
  "http": {
    "port": 3000,
    "hosts": [
      "localhost",
      "192.168.1.2",
      "192.168.1.6"
    ]
  },
  "data": {
    "default": "public",
    "internal": "public",
    "local": "../<cv-generator-life-store>/deploy/public",
    "lifeAdapterLocal": "http://localhost:2500",
    "lifeAdapter": "https://<cv-generator-life-adapter>.herokuapp.com"
  },
  "dataSelector": "default",
  "encrypter": "",
  "loremizer": "loremiRepeater",
  "skipRedirectToHttps": true,
  "useSpdy": false
});

// compress responses
app.use(compression());

/* To snake upper case. */
function toSnakeUpperCase(str) {
  return str.replace(/[A-Z]/g, _ => `_${_.toUpperCase()}`);
};

/* Map environment to configuration. */
function mapEnv2Config(message, envVar, configKey, defaultValue, key = configKey) {
  const retVal = (envVar || nconf.get(configKey) || defaultValue);
  app.set(key, retVal);
  console.info(`${message}: ${retVal}`);
  return retVal;
};

// map environment to configuration
console.log();
const debug = mapEnv2Config('Debug mode', process.env.CV_GENERATOR_PROJECT_SERVER_DEBUG,
  'debug', false);
// override console log
require('./override-console-log')(debug);
console.log();

const appName = mapEnv2Config('Application name', process.env.CV_GENERATOR_PROJECT_SERVER_APP_NAME,
  'appName', 'Project Server');
const appPackageName = mapEnv2Config('Application package name', process.env.CV_GENERATOR_PROJECT_SERVER_APP_PACKAGE_NAME,
  'appPackageName', 'project-server');

const dataDefault = mapEnv2Config('Data default', process.env.CV_GENERATOR_PROJECT_SERVER_DATA_DEFAULT,
  'data:default', false);
const dataLocal = mapEnv2Config('Data local', process.env.CV_GENERATOR_PROJECT_SERVER_DATA_LOCAL,
  'data:local', false);
const dataLifeAdapterLocal = mapEnv2Config('Data lifeAdapterLocal', process.env.CV_GENERATOR_PROJECT_SERVER_DATA_LIFEADAPTERLOCAL,
  'data:lifeAdapterLocal', false);
const dataLifeAdapter = mapEnv2Config('Data lifeAdapter', process.env.CV_GENERATOR_PROJECT_SERVER_DATA_LIFEADAPTER,
  'data:lifeAdapter', false);

const data = mapEnv2Config('Data', process.env.CV_GENERATOR_PROJECT_SERVER_DATA,
  'dataSelector', 'default');
const location = mapEnv2Config('Location', process.env['CV_GENERATOR_PROJECT_SERVER_DATA_' + toSnakeUpperCase(data)],
  'data:' + data, 'https://<distribution>.cloudfront.net/deploy/public', 'location');

const encrypter = mapEnv2Config('Encrypter', process.env.CV_GENERATOR_PROJECT_SERVER_ENCRYPTER,
  'encrypter', '');
const loremizer = mapEnv2Config('Loremizer', process.env.CV_GENERATOR_PROJECT_SERVER_LOREMIZER,
  'loremizer', 'loremiRepeater');

const skipRedirectToHttps = mapEnv2Config('Skip redirect to https', process.env.CV_GENERATOR_PROJECT_SERVER_SKIP_REDIRECT_TO_HTTPS,
  'skipRedirectToHttps', true);
const useSpdy = mapEnv2Config('Use HTTP/2', process.env.CV_GENERATOR_PROJECT_SERVER_USE_SPDY,
  'useSpdy', false);
console.log();

// load app icon
var faviconPath = path.join(__dirname, 'public/favicon', 'favicon.ico');
if (fs.existsSync(faviconPath)) {
  app.use(favicon(faviconPath));
}

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(cors());

// Redirect http to https
/*eslint complexity: ["error", 5]*/
app.get('*', function (req, res, next) {
  console.debug(`app.js: get: req.protocol: ${req.protocol}`);
  if ((!req.secure || req.headers['x-forwarded-proto'] !== 'https') &&
    !['true', 'TRUE'].includes(skipRedirectToHttps) &&
    !nconf.get('http:hosts').includes(req.hostname)
  ) {
    var url = 'https://';
    url += req.hostname;
    url += req.url;
    res.redirect(301, url);
  }
  else
    next() /* Continue to other routes if we're not redirecting */
});

app.use('/json', jsonRouter);
app.use('/', indexRouter);
// app.use(express.static(path.join(__dirname, location), { maxAge: '1w' }));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
