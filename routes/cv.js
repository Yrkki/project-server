var express = require('express');
var router = express.Router();

const path = require('path');

const location = '../public/';

const obfuscator = require('../obfuscator');

router.get('/', function (req, res) {
    var data = require(path.join(location,'json/cv.json'));
    data = obfuscator.obfuscate(data);
    
    res.send(data);
});

module.exports = router;
