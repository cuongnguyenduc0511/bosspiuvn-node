const MAXIMUM_CHARS = 50;
const POSSIBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const moment = require('moment');
const { TOKEN_DURATION_HOURS } = require('../shared/constant');
  

module.exports.generateToken = () => {
    let token = '';

    for (var i = 0; i < MAXIMUM_CHARS; i++)
        token += POSSIBLE_CHARS.charAt(Math.floor(Math.random() * POSSIBLE_CHARS.length));

    return {
        token,
        exp: moment().add(TOKEN_DURATION_HOURS, 'hours')
    };
}
