var express = require('express');
var router = express.Router();

const path = require('path');

const obfuscator = require('../javascripts/obfuscator');

router.get('/', function (req, res) {
    var data = require(path.join(req.app.get('location'),'json/cv.json'));
    data = obfuscator.obfuscate(data);
    
    res.send(data);
});

module.exports = router;
