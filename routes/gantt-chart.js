var express = require('express');
var router = express.Router();

const path = require('path');

const obfuscator = require('../javascripts/obfuscator');

router.get('/', function (req, res) {
    var data = require(path.resolve(req.app.get('json'), 'gantt-chart.json'));

    data = obfuscator.obfuscateWhenNeeded(req.app, data);

    res.send(data);
});

module.exports = router;


String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
