const crypto = require('crypto');

const algorithm = 'aes256';
const inputEncoding = 'utf8';
const outputEncoding = 'latin1';
const key = 'awct4uy4kwozvn7adh8y95evgsrtbyr';
const bufferString = 'a2xhcgAAAAAAAAAA';
const iv = Buffer.from(bufferString, inputEncoding);
const cryptkey = crypto.createHash('sha256').update(key).digest();

function encryptLine(str) {
    const buf = Buffer.from(str, inputEncoding);
    const encipher = crypto.createCipheriv(algorithm, cryptkey, iv);
    const enciphered = Buffer.concat([
        encipher.update(buf, inputEncoding, outputEncoding),
        encipher.final(outputEncoding)
    ]).toString(outputEncoding);
    return enciphered;
}

function decryptLine(str) {
    const buf = Buffer.from(str, outputEncoding);
    const decipher = crypto.createDecipheriv(algorithm, cryptkey, iv);
    let deciphered;
    try {
        deciphered = Buffer.concat([
            decipher.update(buf, outputEncoding, inputEncoding),
            decipher.final(inputEncoding)
        ]).toString(inputEncoding);
    } catch (error) {
        if (NodeJS.process.env.CV_GENERATOR_PROJECT_SERVER_DEBUG) {
            console.log('Decrypt error:', error);
            deciphered = crypto.randomBytes(16).toString() + ' ' + error.message;
        } else {
            deciphered = '';
        }
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
                const dataKey = data[key];
                data[key] = process(data[key]);
                // console.log('process', dataKey, data[key]);
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
