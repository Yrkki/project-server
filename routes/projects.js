var express = require('express');
var router = express.Router();

const path = require('path');

const obfuscator = require('../javascripts/obfuscator');

router.get('/', function (req, res) {
    var data = require(path.resolve(req.app.get('json'), 'projects.json'));

    // preprocess
    data = JSON.parse(JSON.stringify(data).replaceAll('"0"', '""').replaceAll('"n/a"', '""'));

    data = obfuscator.obfuscateWhenNeeded(req.app, data);

    res.send(data);
});

module.exports = router;


String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

// Convert Excel dates into JS date objects
//
// @param excelDate {Number}
// @return {Date}
function getJsDateFromExcel(excelDate) {

    // JavaScript dates can be constructed by passing milliseconds
    // since the Unix epoch (January 1, 1970) example: new Date(12312512312);

    // 1. Subtract number of days between Jan 1, 1900 and Jan 1, 1970, plus 1 (Google "excel leap year bug")             
    // 2. Convert to milliseconds.

    return new Date((excelDate - (25567 + 1)) * 86400 * 1000);
}
