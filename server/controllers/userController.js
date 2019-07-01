const userModel = require('../models/users');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { authMessages } = require('../shared/response_messages');
const { randomString } = require('../shared/modules/randomString');
const { decodeAndSanitizeValue } = require('../shared/modules/sanitize')
const accessTokenController = require('../controllers/accessTokenController');
const { JWT_ID_LENGTH, STATUS_CODE } = require('../shared/constant');
const { validateForm } = require('../modules/validate');

module.exports.addUser = async (req, res, next) => {
  try {
    const { username, password, nickName } = req.submitData;
    var newUser = {
      username: username,
      password: password,
      nickName: nickName,
      createdAt: moment()
    }
    await userModel.addUser(newUser);  
    res.status(STATUS_CODE.SUCCESS).send({
      message: 'User has been created'
    })
  } catch(err) {
    console.log(err);
    res.status(STATUS_CODE.SERVER_ERROR).send({
      message: 'An error occurred while creating users, please try again later'
    })
  }
  // userModel.addUser(newUser, function (err, data) {
  //   if (err) {
  //     res.send(err);
  //   } else {
  //     res.send({
  //       message: 'User created !!'
  //     });
  //   }
  // })
};

module.exports.authenticate = async (req, res) => {
  try {
    const { username, password } = req.submitData;

    const authUser = {
      username,
      password
    }
  
    const { USER_NOT_EXISTS, INVALID_PASSWORD, AUTH_SUCCESS, AUTH_ERROR } = authMessages;
  
    const userData = await userModel.findUser(authUser);

    if (_.isEmpty(userData)) {
      return res.status(STATUS_CODE.UNAUTHORIZED).send({
        message: USER_NOT_EXISTS
      })
    }

    const isPasswordMatch = await userModel.comparePassword(authUser.password, userData.password);
    if (isPasswordMatch) {
      const accessToken = await createAccessToken(userData);
      res.status(STATUS_CODE.SUCCESS).send({
        message: AUTH_SUCCESS,
        accessToken
      })
    } else {
      return res.status(STATUS_CODE.UNAUTHORIZED).send({
        message: INVALID_PASSWORD
      })
    }
  }
  catch (err) {
    console.log(err);
    return res.status(STATUS_CODE.SERVER_ERROR).send({
      message: AUTH_ERROR
    })
  }
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

module.exports.getUserInfo = async (req, res, next) => {
  const userId = req.userId;
  const result = await userModel.getUserById(userId);
  res.send({
    nickName: 'Zhao X'
  });
}
