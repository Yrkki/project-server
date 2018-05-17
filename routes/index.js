var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: req.app.get('appName') });
});

module.exports = router;
