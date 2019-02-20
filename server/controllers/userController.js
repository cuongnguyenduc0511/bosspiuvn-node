const userModel = require('../models/users');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { authMessages } = require('../shared/response_messages');
const { randomString } = require('../shared/modules/randomString');
const { decodeAndSanitizeValue } = require('../shared/modules/sanitize')
const accessTokenController = require('../controllers/accessTokenController');
const { JWT_ID_LENGTH } = require('../shared/constant');
const { validateForm } = require('../modules/validate');

const authValidation = {
    username: {
        presence: {
            message: 'Username is required',
            allowEmpty: false
        },
        length: {
            minimum: 6,
            message: `Username must be at least 6 characters`
        }
    },
    password: {
        presence: {
            message: 'Password is required',
            allowEmpty: false
        },
        length: {
            minimum: 6,
            message: `Password must be at least 6 characters`
        }
    }
};

module.exports.addUser = function (req, res, next) {
    const { username, password, firstName, lastName } = req.body;
    var newUser = {
        username: username,
        password: password,
        firstName: firstName,
        lastName: lastName,
        createdAt: moment()
    }

    userModel.addUser(newUser, function (err, data) {
        if (err) {
            res.send(err);
        } else {
            res.send({
                message: 'User created !!'
            });
        }
    })
};

module.exports.authenticate = async (req, res) => {
    const { username, password } = req.body;

    const authUser = {
        username: decodeAndSanitizeValue(username),
        password: decodeAndSanitizeValue(password),
    }

    const { USER_NOT_EXISTS, INVALID_PASSWORD, AUTH_SUCCESS, AUTH_ERROR } = authMessages;

    const validFormObj = validateForm(authUser, authValidation);
    const isValid = _.isEmpty(validFormObj);

    if (isValid) {
        try {
            const userData = await userModel.findUser(authUser);
            if (_.isEmpty(userData)) {
                return res.status(401).send({
                    message: USER_NOT_EXISTS
                })
            }

            const isPasswordMatch = await userModel.comparePassword(authUser.password, userData.password);
            if (isPasswordMatch) {
                const accessToken = await createAccessToken(userData);
                res.status(200).send({
                    message: AUTH_SUCCESS,
                    accessToken
                })
            } else {
                return res.status(401).send({
                    message: INVALID_PASSWORD
                })
            }
        }
        catch (err) {
            return res.status(500).send({
                message: AUTH_ERROR,
                err
            })
        }
    } else {
        return res.status(400).send({
            message: 'Validation Error',
            validation: validFormObj
        })
    }

    // userModel.findUser(authUser, function (err, userData) {
    //     if (err) {
    //         return res.status(500).send({
    //             message: authMessages.AUTH_ERROR,
    //             error: err
    //         })
    //     }
    //     if (!userData) {
    //         res.status(401).send(USER_NOT_EXISTS);
    //     }
    //     else {
    //         userModel.comparePassword(authUser.password, userData.password, function (comparePwdError, isMatch) {
    //             if (comparePwdError) {
    //                 return res.status(500).send({
    //                     message: authMessages.AUTH_ERROR,
    //                     error: comparePwdError
    //                 })
    //             }
    //             if (isMatch) {
    //                 // Match
    //                 const jwtId = randomString(JWT_ID_LENGTH);
    //                 const currentTime = moment();
    //                 const tokenExpTime = moment().add(1, 'day');

    //                 const accessToken = {
    //                     userId: userData._id,
    //                     tokenId: jwtId,
    //                     accessDate: currentTime,
    //                     expiryDate: tokenExpTime,
    //                     isRevoked: false
    //                 }

    //                 accessTokenController.addToken(accessToken, function (addTokenErr, data) {
    //                     if (addTokenErr) {
    //                         return res.status(500).send({
    //                             message: authMessages.AUTH_ERROR,
    //                             error: addTokenErr
    //                         })
    //                     } else {
    //                         let payload = {
    //                             userId: userData._id
    //                         }
    //                         const issuer = req.protocol + '://' + req.get('host');
    //                         let token = jwt.sign(payload, 'secretKey', { jwtid: jwtId, audience: 'bosspiuvn', issuer, expiresIn: tokenExpTime.unix() });
    //                         res.status(200).json({
    //                             message: AUTH_SUCCESS,
    //                             token: token
    //                         });
    //                     }
    //                 })
    //             } else {
    //                 res.status(401).send(INVALID_PASSWORD);
    //             }
    //         });
    //     }
    // });
};

async function createAccessToken(userData) {
    const jwtId = randomString(JWT_ID_LENGTH);
    const currentTime = moment();
    const tokenExpTime = moment().add(1, 'day');

    const accessToken = {
        userId: userData._id,
        tokenId: jwtId,
        accessDate: currentTime,
        expiryDate: tokenExpTime,
        isRevoked: false
    }

    return Promise.resolve(accessTokenController.addToken(accessToken).then(data => {
        let payload = {
            userId: userData._id
        }
        const issuer = 'bosspiuvn';
        let token = jwt.sign(payload, 'secretKey', { jwtid: jwtId, audience: 'bosspiuvn', issuer, expiresIn: tokenExpTime.unix() });
        return Promise.resolve(token);
    }).catch(err => {
        return Promise.reject(err);
    }));
}

module.exports.getUserInfo = function (req, res, next) {
    const userId = req.userId;
    console.log(userId);
    userModel.getUserById(userId, function (err, userData) {
        if (err) throw err;
        if (!userData) {
            res.status(401).send({
                message: authMessages.USER_NOT_EXISTSS
            });
        } else {
            res.status(200).json({
                firstName: userData.firstName,
                lastName: userData.lastName
            })
        }
    });
}
