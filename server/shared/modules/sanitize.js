const sanitizeHtml = require('sanitize-html');
var decode = require('decode-html');
const _ = require('lodash');

module.exports.decodeAndSanitizeValue = (value) => {
    if(value) {
        let sanitized = sanitizeParam(value).trim();
        return decode(sanitized);    
    }

    return null;
}

module.exports.decodeAndSanitizeObject = (object) => {
    if (!_.isEmpty(object)) {
        Object.keys(object).forEach((key) => {
            if (object[key] && typeof object[key] === 'object') {
                module.exports.decodeAndSanitizeObject(object[key]);
                return;
            }
            object[key] = module.exports.decodeAndSanitizeValue(object[key]);
        })
    }
    return null;
}

function sanitizeParam(dirty) {
    var sanitized = sanitizeHtml(dirty, {
        allowedTags: [],
        allowedAttributes: [],
    });

    return sanitized.trim();
}
