var express = require('express');
var router = express.Router();

const path = require('path');

const obfuscator = require('../javascripts/obfuscator');
const cacheControl = require('../javascripts/cacheControl');

router.get('/', function (req, res) {
    var data = require(path.resolve(req.app.get('json'), 'gantt-chart.json'));

    data = obfuscator.obfuscateWhenNeeded(req.app, data);

    cacheControl.setCacheControl(res);
    res.send(data);
});

module.exports = router;
