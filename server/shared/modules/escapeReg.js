const _ = require('lodash');

//Escape RegExp
module.exports.escapeRegExp = (text) => {
    // return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    return _.replace(text, /[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}