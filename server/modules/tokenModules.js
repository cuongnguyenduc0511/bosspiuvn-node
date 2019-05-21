const MAXIMUM_CHARS = 50;
const moment = require('moment');
const { randomString } = require('../shared/modules/randomString');
const { TOKEN_DURATION_HOURS } = require('../shared/constant');

module.exports.generateToken = () => {
    let token = randomString(MAXIMUM_CHARS);
    return {
        token,
        exp: moment().add(TOKEN_DURATION_HOURS, 'hours')
    };
}

module.exports.generateActivationToken = () => {
    let token = '';
    const genTimes = 5;
    const MAX_LENGTH = 5;
    for (var i = 0; i < genTimes; i++) {
        token += `${randomString(MAX_LENGTH).toLowerCase()}${ i !== (genTimes - 1) ? '-' : ''}`
    }
    return token;
}
