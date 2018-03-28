var express = require('express');
var router = express.Router();

const path = require('path');

const location = '../public/';

const obfuscator = require('../obfuscator');

router.get('/', function (req, res) {
    var data = require(path.join(location, 'json/gantt-chart.json'));

    // preprocess
    data = JSON.parse(JSON.stringify(data).replaceAll('"0"', '""').replaceAll('"n/a"', '""'));
    data = obfuscator.obfuscate(data);

    res.send(data);
});

module.exports = router;


String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
