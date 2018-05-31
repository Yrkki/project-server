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
  "http": {
    "port": 3000,
    "hosts": [
      "localhost",
      "192.168.1.2"
    ]
  },
  "data": {
    "default": "public",
    "internal": "public",
    "local": "../cv-generator-life-store/deploy/public",
    "lifeAdapterLocal": "http://localhost:2500",
    "lifeAdapter": "https://cv-generator-life-adapter.herokuapp.com"
  }
});

// compress responses
app.use(compression());

app.set('appName', 'Project Server');

app.set('default', nconf.get('data:default'));
app.set('internal', nconf.get('data:internal'));
app.set('local', nconf.get('data:local'));
app.set('lifeAdapterLocal', nconf.get('data:lifeAdapterLocal'));
app.set('lifeAdapter', nconf.get('data:lifeAdapter'));

const data = (process.env.CV_GENERATOR_PROJECT_SERVER_DATA || 'default');
app.set('data', data);
const location = nconf.get('data:' + data);
app.set('location', location);
console.log('Data location: [%s:%s]', data, location);

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

/* Redirect http to https */
app.get('*', function (req, res, next) {
  if (req.headers['x-forwarded-proto'] != 'https' && !nconf.get('http:hosts').includes(req.hostname)) {
    var url = 'https://' + req.hostname;
    // var port = app.get('port');
    // if (port)
    //   url += ":" + port;
    url += req.url;
    res.redirect(url);
  }
  else
    next() /* Continue to other routes if we're not redirecting */
});

app.use('/json', jsonRouter);
app.use('/', indexRouter);
// app.use(express.static(path.join(__dirname, location), { maxAge: '1w' }));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
