var express = require('express');
var router = express.Router();

const path = require('path');

const location = '../public/';

/* GET cv. */
router.get('/', function (req, res) {
    var data = require(path.join(location,'json/cv.json'));
    res.send(data);
});

module.exports = router;
