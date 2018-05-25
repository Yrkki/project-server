const crypto = require('crypto');

const algorithm = 'aes256';
const inputEncoding = 'utf8';
const outputEncoding = 'latin1';
const key = 'awct4uy4kwozvn7adh8y95evgsrtbyr';

function encryptLine(str) {
    const cipher = crypto.createCipher(algorithm, key);
    var ciphered = cipher.update(str, inputEncoding, outputEncoding);
    ciphered += cipher.final(outputEncoding);
    return ciphered;
}

function decryptLine(str) {
    const decipher = crypto.createDecipher(algorithm, key);
    var deciphered = decipher.update(str, outputEncoding, inputEncoding);
    try {
        deciphered += decipher.final(inputEncoding);
    } catch (error) {
        deciphered = crypto.randomBytes(16).toString();
    }
    return deciphered;
}

var processor;

function encrypt(data) {
    processor = encryptLine;
    return process(data);
}

function decrypt(data) {
    processor = decryptLine;
    return process(data);
}

function process(data) {
    // decryptData per se
    if (typeof data == 'string' && data !== '')
        return processor(data);

    // recurse
    else if (data instanceof Array)
        return data.map(_ => process(_));
    else if (typeof data == 'object') {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                data[key] = process(data[key]);
            }
        }
        return data;
    }

    // skip
    else {
        return data;
    }
}

module.exports = {
    encrypt: encrypt,
    decrypt: decrypt
}
