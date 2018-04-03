var express = require('express');
var router = express.Router();

const path = require('path');

const obfuscator = require('../javascripts/obfuscator');

router.get('/', function (req, res) {
    var data = require(path.resolve(req.app.get('json'), 'ui.json'));

    try {
        data.Disclaimer.text = data.Disclaimer.text.join(' ');
    } catch (e) {
    }

    data = obfuscator.obfuscateWhenNeeded(req.app, data);

    res.send(data);
});

module.exports = router;
