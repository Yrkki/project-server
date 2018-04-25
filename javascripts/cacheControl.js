var ms = require('ms');

function setCacheControl(res) {
    var maxAge = ms('7d');
    res.setHeader('Cache-Control', 'public, max-age=' + maxAge);
}

module.exports = {
    setCacheControl: setCacheControl
}
