const path = require('path');
const urlExists = require('url-exists');
const fs = require('fs');

const li = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ";

function obfuscateWhenNeeded(currentPath, data) {
    // console.log('Obfuscating...');

    const a = 'auth.json';
    if (currentPath.startsWith('http')) {
        const authUrl = currentPath + '/' + a;
        // console.log('Checking url:', authUrl);

        const urlExistsPromise = url =>
            new Promise((resolve, reject) =>
                urlExists(url, (err, exists) =>
                    err ? reject(err) : resolve(exists)));

        return urlExistsPromise(authUrl).then(exists =>
            exists ? data : obfuscate(data));
    } else {
        const authPath = path.resolve(currentPath, a);
        // console.log('Checking path:', authPath);
        if (!fs.existsSync(authPath)) {
            data = obfuscate(data);
        }
        return new Promise(resolve => resolve(data));
    }
}

function obfuscate(data) {
    // adjust
    if (data === null)
        return '';
    else if (typeof data == 'number')
        return Math.round(data * (1 + (Math.random() * .2 - .1))); // 10% random scattring
    else if (/(^#[0-9A-F]{8}$)|(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(data))  // color
        return data;

    // obfuscate per se
    else if (typeof data == 'string')
        if (data === '')
            return data;
        else
            return obfuscateLine(data);

    // recurse
    else if (data instanceof Array)
        return data.map(_ => obfuscate(_));
    else if (typeof data == 'object') {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                if (!['Id'].includes(key))
                    data[key] = obfuscate(data[key]);
            }
        }
        return data;
    }

    // skip
    else {
        return data;
    }
};

const loremizer = process.env.CV_GENERATOR_PROJECT_SERVER_LOREMIZER === 'loremiTranscriber'
    ? loremiTranscriber
    : process.env.CV_GENERATOR_PROJECT_SERVER_LOREMIZER === 'loremiRepeater'
        ? loremiRepeater
        : loremiTranslator;

function loremiTranslator(str, i) {
    return li[i % li.length];
}

function loremiTranscriber(str, i) {
    return li[(str.charCodeAt(i) - 'a'.charCodeAt(0)) % li.length];
}

function loremiRepeater(str, i) {
    return str[i];
}

function obfuscateLine(str) {
    var outArray = [];

    for (var i = 0; i < str.length; i++) {
        outArray.push(loremizer(str, i));
    }

    return outArray.join('');
}

module.exports = {
    obfuscateWhenNeeded: obfuscateWhenNeeded
}
