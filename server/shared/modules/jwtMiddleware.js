const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const { authMessages } = require('../response_messages');
const accessTokenController = require('../../controllers/accessTokenController');

module.exports.verifyToken = function (req, res, next) {
    if (!req.headers.authorization) {
        return res.status(401).send({
            message: authMessages.UNAUTHORIZED
        });
    }

    let token = req.headers.authorization.split(' ')[1];
    if (token === 'null') {
        return res.status(401).send({
            message: authMessages.UNAUTHORIZED
        });
    }

    jwt.verify(token, 'secretKey', function (err, decoded) {
        if (err) {
            return res.status(401).send({
                message: authMessages.TOKEN_EXPIRED
            });
        } else {
            jwtMiddleware(req, res, function(err) {
                if(err) {
                    return res.status(401).send({
                        message: authMessages.UNAUTHORIZED,
                        type: 'REVOKED'
                    });
                } else {
                    req.userId = decoded.userId;
                    req.revokedId = decoded.jti;
                    next();        
                }
            })
        }
    });
}

const jwtMiddleware = expressJwt({
    secret: 'secretKey',
    isRevoked: function (req, payload, done) {
        accessTokenController.checkRevoked(payload.userId, payload.jti, function(err, isRevoked) {
            if (err) {
                return res.status(500).send({
                    message: authMessages.AUTH_ERROR
                })
            } else {
                done(null, isRevoked);
            }
        });
    }
});
