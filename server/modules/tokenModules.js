const MAXIMUM_CHARS = 50;
const POSSIBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

module.exports.generateToken = () => {
    let token = '';

    for (var i = 0; i < MAXIMUM_CHARS; i++)
        token += POSSIBLE_CHARS.charAt(Math.floor(Math.random() * POSSIBLE_CHARS.length));

    return token;
}

module.exports.addTokenExpirationTime = (date, hour) => {
    var result = new Date(date);
    result.setHours(result.getHours() + hour);
    return result;
}
