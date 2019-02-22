const requestModel = require('../models/request');
const pagination = require('../shared/modules/pagination');
const { UPDATE_MODE, STATUS_CODE, REQUEST_STATUS, ID_LENGTH, TOKEN_DURATION_DAY } = require('../shared/constant');
const { requestMessages } = require('../shared/response_messages');
const tokenModule = require('../modules/tokenModules');
const { randomString } = require('../shared/modules/randomString');
const { decodeAndSanitizeObject } = require('../shared/modules/sanitize')
const nodemailer = require('nodemailer');
const hbsNodemailer = require('nodemailer-express-handlebars');
const _ = require('lodash');

const nodemailerTransport = nodemailer.createTransport({
  host: process.env.MAIL_SERVICE_HOST,
  port: process.env.MAIL_SERVICE_HOST_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

const nodemailerOptions = {
  viewEngine: {
    extname: '.hbs',
    layoutsDir: 'views/email/',
    defaultLayout: 'email_default',
    // partialsDir : 'views/partials/'
  },
  viewPath: 'views/email/',
  extName: '.hbs'
};

nodemailerTransport.use('compile', hbsNodemailer(nodemailerOptions));

module.exports.getItemById = (req, res) => {
  const requestId = req.params.id;
  try {
    requestModel.getItemById(requestId, (err, result) => {
      let requestItem = result[0];
      if (err) {
        res.status(500).send(err);
      } else {
        const statusCode = _.isEmpty(requestItem) ? 404 : 200;
        const notFound = {
          message: 'Request item not found',
          status: 404
        }
        requestItem = _.isEmpty(requestItem) ? notFound : requestItem
        res.status(statusCode).send(requestItem);
      }
    });
  } catch (err) {
    res.status(500).send(err);
  }
};

module.exports.getRequests = async (req, res) => {
  try {
    const paginationResult = await pagination.getData(req, res, requestModel);
    let statusCode = !_.isEmpty(paginationResult.items) && paginationResult.items.length > 0 ? 200 : 404;
    res.status(statusCode).send(paginationResult);
  } catch (err) {
    const errorStatus = err.status || STATUS_CODE.SERVER_ERROR;
    res.status(errorStatus).send({
      message: 'An error occurred while fetching data, please try again later',
      err
    });
  }
};

module.exports.requestToken = async (req, res) => {
  const { email, mode, requestId } = req.body;
  const { getItemByIdAsync } = requestModel;
  try {
    if (_.isEmpty(requestId)) {
      return res.status(STATUS_CODE.BAD_REQUEST).send({
        message: 'Request ID Required'
      });
    }
    const requestItemResult = await getItemByIdAsync(requestId);
    if (requestItemResult.length > 0) {
      const requestItem = requestItemResult[0];
      const { generateToken, addTokenExpirationTime } = tokenModule;
      const tokenPayload = {
        token: generateToken(),
        exp: addTokenExpirationTime(Date.now(), TOKEN_DURATION_DAY)
      }

      if (email === requestItem.email) {
        const updateResult = await sendTokenEmail(requestItem, mode, tokenPayload);
        if (!_.isEmpty(updateResult)) {
          const { updateMode, registeredEmail } = updateResult;
          res.status(STATUS_CODE.SUCCESS).send({
            message: `Your ${updateMode} token has been sent to your email: ${registeredEmail}, please check your email`
          })
        }
      } else {
        return res.status(STATUS_CODE.BAD_REQUEST).send({
          message: `Wrong email, please type your valid email`
        });
      }
    } else {
      return res.status(STATUS_CODE.NOT_FOUND).send({
        message: 'Request Id Not Found'
      })
    }
  } catch (err) {
    return res.status(STATUS_CODE.SERVER_ERROR).send({
      message: 'An error occurred while requesting token, Please try again later',
      err
    })
  }
}

module.exports.registerNewRequest = async (req, res) => {
  try {
    const { addData, getItemByIdAsync } = requestModel;
    const { requesterNote, ...rest } = req.body;
    const data = { ...rest };
    decodeAndSanitizeObject(data);
    const requestId = await generateRequestId();

    const {
      stepchartLevel,
      stepchartType,
      song,
      contentName,
      stepmaker,
      requester,
      ucsLink,
      email
    } = data;

    const submitData = {
      requestId,
      stepchartInfo: {
        stepchartType,
        stepchartLevel
      },
      note: {
        requesterNote
      },
      song,
      requester,
      stepmaker,
      contentName,
      ucsLink,
      email
    }

    const addedDoc = await addData(submitData);
    const addedItemResult = await getItemByIdAsync(addedDoc.requestId);
    const addedItemInfo = addedItemResult[0];
    const emailSent = await sendRegisterEmail(addedItemInfo);
    if (!_.isEmpty(emailSent)) {
      res.status(STATUS_CODE.SUCCESS).send({
        message: `Your request has been sent, please check your email: ${addedItemInfo.email} to confirm your request`
      });
    }
  } catch (err) {
    const { status, error } = err;
    const statusCode = status || STATUS_CODE.SERVER_ERROR;
    return res.status(statusCode).send({
      message: requestMessages.REGISTER_ERROR,
      err: error || err
    });
  }
}

module.exports.updateRequestByToken = async (req, res) => {
  const { getItemByIdAsync, updateRequestByID, removeToken } = requestModel;
  try {
    const {
      requesterNote,
      ...rest
    } = req.body;
    decodeAndSanitizeObject(rest);
    const formData = rest;
    const {
      requestId,
      stepchartType,
      stepchartLevel,
      requester,
      stepmaker,
      ucsLink,
      contentName,
      updateToken
    } = formData;
    if (!requestId) {
      return res.status(STATUS_CODE.BAD_REQUEST).send({
        message: 'Request ID Required'
      });
    }
    const requestItemResult = await getItemByIdAsync(requestId);
    if (requestItemResult.length > 0) {
      const requestItem = requestItemResult[0];
      if (_.isEmpty(requestItem.updateToken)) {
        return res.status(STATUS_CODE.BAD_REQUEST).send({
          message: 'Please request update token'
        });
      }

      if (updateToken === requestItem.updateToken.token) {
        const timeSubmit = new Date();
        if (timeSubmit < requestItem.updateToken.exp) {

          const updateData = {
            stepchartInfo: {
              stepchartType,
              stepchartLevel
            },
            note: {
              requesterNote
            },
            requester,
            stepmaker,
            ucsLink,
            contentName,
            status: REQUEST_STATUS.PENDING
          }

          await removeToken(requestId, UPDATE_MODE.UPDATE);
          await updateRequestByID(requestId, updateData);
          res.status(STATUS_CODE.SUCCESS).send({
            message: 'Congratulations, your request has been successfully updated'
          });
        } else {
          // Remove Update Token
          await removeToken(requestId, UPDATE_MODE.UPDATE);
          res.status(STATUS_CODE.BAD_REQUEST).send({
            message: 'Token has been expired, please request new token'
          });
        }
      } else {
        res.status(STATUS_CODE.BAD_REQUEST).send({
          message: 'Wrong token, please type your valid token'
        });
      }
    } else {
      res.status(STATUS_CODE.NOT_FOUND).send({
        message: 'Request Id Not Found'
      });
    }
  } catch (err) {
    res.status(STATUS_CODE.SERVER_ERROR).send({
      message: 'An error occurred while updating request, Please try again later'
    })
  }
}

module.exports.deleteRequestByToken = async (req, res) => {
  const form = req.body;
  decodeAndSanitizeObject(form);
  const { requestId, email, deleteToken } = form;
  const { getItemByIdAsync, removeToken, deleteRequest } = requestModel;
  try {
    if (_.isEmpty(requestId)) {
      return res.status(STATUS_CODE.BAD_REQUEST).send({
        message: 'Request ID Required'
      });
    }

    const requestItemResult = await getItemByIdAsync(requestId)
    if (requestItemResult.length > 0) {
      const requestItem = requestItemResult[0];
      if (_.isEmpty(requestItem.deleteToken)) {
        return res.status(STATUS_CODE.BAD_REQUEST).send({
          message: 'Please request delete token'
        });
      }

      if (email === requestItem.email && deleteToken === requestItem.deleteToken.token) {
        const timeSubmit = new Date();
        if (timeSubmit < requestItem.deleteToken.exp) {
          // Delete Success
          await deleteRequest(requestId);
          res.status(STATUS_CODE.SUCCESS).send({
            message: 'Congratulations, your request has been successfully deleted'
          });
        } else {
          // Remove Delete Token
          await removeToken(requestId, UPDATE_MODE.DELETE);
          res.status(STATUS_CODE.BAD_REQUEST).send({
            message: 'Token has been expired, please request new token'
          });
        }
      } else {
        return res.status(STATUS_CODE.BAD_REQUEST).send({
          message: 'Wrong email / token, please type your valid email / token'
        });
      }
    } else {
      return res.status(STATUS_CODE.BAD_REQUEST).send({
        message: 'Request ID Not found'
      })
    }
  } catch (err) {
    console.log(err);
    return res.status(STATUS_CODE.SERVER_ERROR).send({
      message: 'An error occured while deleting request, please try again later',
      err
    })
  }
}

async function sendRegisterEmail(addedRequest) {
  const {
    requestId,
    stepchartInfo,
    song,
    email
  } = addedRequest;
  const { stepchartLevel, stepchartType } = stepchartInfo;

  const title = `[BOSS_PIUVN - UCS Request] - Request ID ${requestId}: ${song.name} ${stepchartType.shortLabel}${(stepchartType.value === 'co-op') ? ` ${stepchartLevel}` : stepchartLevel} has been sent`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: title,
    template: 'register_body',
    context: {
      target: addedRequest
    }
  }

  try {
    const result = await nodemailerTransport.sendMail(mailOptions);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

async function sendTokenEmail(requestItem, updateMode, tokenPayload) {
  let updateData = {};
  const { song, stepchartInfo, email, requestId } = requestItem;
  const { stepchartType, stepchartLevel } = stepchartInfo;
  let mode;
  switch (updateMode) {
    case UPDATE_MODE.UPDATE:
      mode = UPDATE_MODE.UPDATE;
      updateData.updateRequestToken = tokenPayload;
      break;
    case UPDATE_MODE.DELETE:
      mode = UPDATE_MODE.DELETE;
      updateData.deleteRequestToken = tokenPayload;
      break;
  }

  const title = `[BOSS_PIUVN - UCS Request] - ${mode} Token for Request ${song.name} ${stepchartType.shortLabel}${(stepchartType.value === 'co-op') ? ` ${stepchartLevel}` : stepchartLevel}`

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: title,
    template: 'token_body',
    context: {
      target: requestItem,
      tokenPayload,
      mode,
      modeLowercase: mode.toLowerCase()
    }
  }

  try {
    await requestModel.updateRequestByID(requestId, updateData);
    await nodemailerTransport.sendMail(mailOptions);
    return Promise.resolve({
      updateMode: mode.toLowerCase(),
      registeredEmail: email
    });
  } catch (err) {
    return Promise.reject(err);
  }
}

async function generateRequestId() {
  const randomId = randomString(ID_LENGTH);
  try {
    const result = await requestModel.getItemByIdAsync(randomId);
    if (!_.isEmpty(result)) {
      generateRequestId();
    } else {
      return Promise.resolve(randomId);
    }
  } catch (err) {
    return Promise.reject(err);
  }
}