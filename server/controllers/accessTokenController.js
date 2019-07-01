const accessTokenModel = require('../models/accessTokens');
const { authMessages } = require('../shared/response_messages');
const _ = require('lodash');

module.exports.addToken = async function (accessToken) {
  accessTokenModel.addToken(accessToken, function (err, data) {
    if (err) {
      throw err;
    } else {
      return Promise.resolve(data);
    }
  });
};

module.exports.setRevoked = function (req, res, next) {
  const userId = req.userId;
  const tokenId = req.revokedId;

  accessTokenModel.setRevoked(userId, tokenId, function (err, data) {
    if (err) {
      res.status(401).send({
        message: authMessages.SIGN_OUT_FAILED
      })
    } else {
      res.send({
        message: authMessages.SIGN_OUT_SUCCESS
      })
    }
  });
};


module.exports.checkRevoked = function (userId, accessTokenId, callback) {
  accessTokenModel.getTokenById(userId, accessTokenId, function (err, tokenDoc) {
    if (err) {
      callback(err, null);
    } else {
      if (_.isEmpty(tokenDoc)) {
        callback(null, false);
      } else {
        const { isRevoked } = tokenDoc;
        callback(null, isRevoked);
      }
    }
  });
}

