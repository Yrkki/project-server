const crypto = require('crypto');

const algorithm = 'aes256';
const inputEncoding = 'utf8';
const outputEncoding = 'base64';
const key = 'awct4uy4kwozvn7adh8y95evgsrtbyr';
const bufferString = 'a2xhcgAAAAAAAAAA';
const iv = Buffer.from(bufferString, inputEncoding);
const cryptkey = crypto.createHash('sha256').update(key).digest();

function encryptLine(str) {
    const buf = Buffer.from(str, inputEncoding);
    const encipher = crypto.createCipheriv(algorithm, cryptkey, iv);
    const enciphered =
        encipher.update(buf, inputEncoding, outputEncoding) +
        encipher.final(outputEncoding);
    return enciphered;
}

function decryptLine(str) {
    const buf = Buffer.from(str, outputEncoding);
    const decipher = crypto.createDecipheriv(algorithm, cryptkey, iv);
    let deciphered;
    try {
        deciphered =
            decipher.update(buf, outputEncoding, inputEncoding) +
            decipher.final(inputEncoding);
    } catch (error) {
        console.debug('encrypter.js: Decrypt error:', str, error);
        deciphered = crypto.randomBytes(16).toString() + ' ' + error.message;
    }
    return deciphered;
}

var processor;

function encrypt(data) {
    processor = encryptLine;
    return doProcess(data);
}

function decrypt(data) {
    processor = decryptLine;
    return doProcess(data);
}

function doProcess(data) {
    // decryptData per se
    if (typeof data == 'string' && data !== '')
        return processor(data);

    // recurse
    else if (data instanceof Array)
        return data.map(_ => doProcess(_));
    else if (typeof data == 'object') {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const dataKey = data[key];
                data[key] = doProcess(data[key]);
                console.debug('encrypter.js: doProcess', dataKey, data[key]);
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
