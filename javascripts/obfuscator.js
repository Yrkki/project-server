var active = true;

const li = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ";

function obfuscate(data) {
    if (typeof data == 'number')
        return Math.round(data*(1 + (Math.random()*.2 - .1))); // 10% random scattring
    else if (/(^#[0-9A-F]{8}$)|(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(data))  // color
        return data
    else if (typeof data == 'string')
        return obfuscateLine(data)
    else if (data instanceof Array)
        return data.map(_ => obfuscate(_))
    else if (typeof data == 'object')
        return toObject(Object.keys(data), Object.values(data).map(_ => obfuscate(_)))
    else
        return data;
};

function toObject(names, values) {
    var result = {};
    for (var i = 0; i < names.length; i++)
        result[names[i]] = values[i];
    return result;
}

function obfuscateLine(str) {
    if (!active)
        return str;

    var outArray = [];

    for (var i = 0; i < str.length; i++) {
        outArray.push(li[i % li.length]);
    }

    return outArray.join('');
}

module.exports = {
    obfuscate: obfuscate
}
