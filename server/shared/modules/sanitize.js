const sanitizeHtml = require('sanitize-html');
var decode = require('decode-html');

module.exports.decodeAndSanitizeValue = (value) => {
    if(value) {
        let sanitized = sanitizeParam(value).trim();
        return decode(sanitized);    
    }

    return null;
}

module.exports.decodeAndSanitizeObject = (obj) => {
    Object.keys(obj).forEach((key, index) => {
        obj[key] = module.exports.decodeAndSanitizeValue(obj[key])
    });
}

function sanitizeParam(dirty) {
    var sanitized = sanitizeHtml(dirty, {
        allowedTags: [],
        allowedAttributes: [],
    });

    return sanitized.trim();
}
