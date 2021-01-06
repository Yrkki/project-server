var spacer = '  ';

function overrideConsoleLog() {
    var _log = console.log;
    var _info = console.info;
    var _debug = console.debug;
    var _warn = console.warn;
    var _error = console.error;

    if (process.env.CV_GENERATOR_PROJECT_SERVER_DEBUG !== 'true') {
        console.log = function () { };
        console.info = function () { };
        console.debug = function () { };
        console.warning = function () { };
        console.error = function () { };
        return;
    }

    console.log = function (message) {
        message = `${spacer}${message}`;
        _log.apply(console, arguments);
    };

    console.info = function (message) {
        message = `${spacer}INFO: ${message}`;
        _info.apply(console, arguments);
    };

    console.debug = function (message) {
        message = `${spacer}DEBUG: ${message}`;
        _debug.apply(console, arguments);
    };

    console.warning = function (message) {
        message = `${spacer}WARNING: ${message}`;
        _warn.apply(console, arguments);
    };

    console.error = function (message) {
        message = `${spacer}ERROR: ${message}`;
        _error.apply(console, arguments);
    };
};

module.exports = overrideConsoleLog;
