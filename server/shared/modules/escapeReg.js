const _ = require('lodash');

//Escape RegExp
module.exports.escapeRegExp = (text) => {
    return _.replace(text, /[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}