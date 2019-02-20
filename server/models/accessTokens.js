// jshint ignore: start

var mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const AccessTokenSchema = new Schema({
    userId: {
        type: ObjectId,
        trim: true,
        required: true
    },
    tokenId: {
        type: String,
        trim: true,
        required: true
    },
    isRevoked: {
        type: Boolean,
        required: true
    },
    accessDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    }
}, { collection: 'access_tokens' });


var AccessToken = module.exports = mongoose.model('access_tokens', AccessTokenSchema);

module.exports.addToken = function (accessToken, callback) {
    const newAccessToken = new AccessToken(accessToken);
    newAccessToken.save(callback);
}

module.exports.getTokenById = function (userId, accessTokenId, callback) {
    const query = {
        userId,
        tokenId: accessTokenId
    }
    AccessToken.findOne(query, callback);
}

module.exports.setRevoked = function (userId, accessTokenId, callback) {
    const query = {
        userId,
        tokenId: accessTokenId
    }

    AccessToken.findOneAndUpdate(
        query,
        { $set: { isRevoked: true } }
        ,
        callback
    )
}
