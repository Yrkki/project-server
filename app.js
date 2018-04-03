var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var cors = require('cors');
var nconf = require('nconf');

var index = require('./routes/index');
var users = require('./routes/users');
var fs = require('fs');

var cv = require('./routes/cv');
var projects = require('./routes/projects');
var ganttChart = require('./routes/gantt-chart');
var entities = require('./routes/entities');
var ui = require('./routes/ui');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// set up congifuration
nconf.argv().env();
nconf.file({ file: 'config.json' });
nconf.defaults({
  "http": {
    "port": 3000
  },
  "data": {
    "location": "public"
  }
});

app.set('location', nconf.get('data:location'));

app.set('json', path.join(app.get('location'), 'json'));

// load app icon
var faviconPath = path.join(__dirname, app.get('location'), 'favicon.ico');
if (fs.existsSync(faviconPath)) {
  app.use(favicon(faviconPath));
}

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, app.get('location'))));

app.use(cors());

app.use('/', index);
app.use('/users', users);

app.use('/cv', cv);
app.use('/projects', projects);
app.use('/gantt-chart', ganttChart);
app.use('/entities', entities);
app.use('/ui', ui);

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
