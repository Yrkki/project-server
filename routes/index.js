var express = require('express');
var router = express.Router();

router.get(/.*/, function (req, res, next) {
  if (req.url.length > 1) {
    // console.log('Getting:', req.app.get('awsLocation') + req.url);
    res.redirect(req.app.get('awsLocation') + req.url);
  } else {
    // console.log('Redirecting home.');
    res.render('index', { title: req.app.get('appName') });
  }
});

module.exports = router;
