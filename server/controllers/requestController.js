const requestModel = require('../models/request');
const pagination = require('../shared/modules/pagination');
const { UPDATE_MODE, STATUS_CODE, REQUEST_STATUS,
  ID_LENGTH, ERROR_STATUS_TYPES, EXPIRATION_DURATION_DAYS } = require('../shared/constant');
const { requestMessages } = require('../shared/response_messages');
const { generateToken, generateActivationToken } = require('../modules/tokenModules');
const { randomString } = require('../shared/modules/randomString');
const { decodeAndSanitizeObject, decodeAndSanitizeValue } = require('../shared/modules/sanitize')
const nodemailer = require('nodemailer');
const hbsNodemailer = require('nodemailer-express-handlebars');
const _ = require('lodash');
const moment = require('moment');

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
    partialsDir: 'views/email/'
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

module.exports.activateRequest = async (req, res) => {
  const { getItemByIdAsync } = requestModel;
  const { id: requestId, token } = req.query;
  const requestItemResult = await getItemByIdAsync(requestId);
  try {
    if (requestItemResult.length > 0) {
      const requestItem = requestItemResult[0];
      if (requestItem.isActivated) {
        return res.status(STATUS_CODE.SUCCESS).send(
          `<h2 style="color: blue">Request ID: ${requestId} is already activated</h2>`
        )
      }
      
      if (token === requestItem.activationToken.token && !requestItem.isActivated) {
        await requestModel.activateRequest(requestId);
        res.status(STATUS_CODE.SUCCESS).send(
          `<h2 style="color: green">Request id: ${requestId} has been successfully activated</h2>`
        )
      } else {
        return res.status(STATUS_CODE.BAD_REQUEST).send(
          `<h2 style="color: red">Activate token does not match for Request id: ${requestId}</h2>`
        )
      }
    } else {
      return res.status(STATUS_CODE.NOT_FOUND).send(
        `<h2 style="color: red">Wrong Request ID / Request ID does not exist</h2>`
      )
    }
  } catch (err) {
    return res.status(STATUS_CODE.SERVER_ERROR).send({
      message: 'An error occurred while activating token, Please try again later',
      err
    })
  }
}

module.exports.requestToken = async (req, res) => {
  const { email, mode, requestId } = req.body;
  decodeAndSanitizeValue(email);
  const submitEmail = String(email).toLowerCase();
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
      const tokenPayload = generateToken();
      if (submitEmail === requestItem.email) {
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
    const requestId = await generateRequestId();

    const {
      stepchartLevel,
      stepchartType,
      song,
      contentName,
      stepmaker,
      requester,
      ucsLink,
      email,
      requesterNote
    } = req.submitData;

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
      activationToken: {
        token: generateActivationToken(),
        exp: moment().add(8, 'hours')
      },
      email
    }

    const addedDoc = await addData(submitData);
    const addedItemResult = await getItemByIdAsync(addedDoc.requestId);
    const addedItemInfo = addedItemResult[0];
    const emailSent = await sendRegisterEmail(addedItemInfo, req);
    if (!_.isEmpty(emailSent)) {
      res.status(STATUS_CODE.SUCCESS).send({
        message: `Your request has been sent, please check your email: ${addedItemInfo.email} to activate your request`
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
          await requestModel.removeFields(requestId, { expiredDate: 1 });
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
        message: 'Request ID required'
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
        message: 'Request ID does not exist'
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

module.exports.updateRequestStatus = async (req, res) => {
  const { status } = req.body;
  const requestId = req.params.id;
  const requestStatusTypes = _.values(REQUEST_STATUS);

  if (!requestId) {
    return res.status(STATUS_CODE.BAD_REQUEST).send({
      message: 'Request ID required'
    });
  }

  const result = await requestModel.getItemByIdAsync(requestId);
  const updateItem = result[0];

  if (_.isEmpty(updateItem)) {
    return res.status(STATUS_CODE.BAD_REQUEST).send({
      message: 'Request ID does not exist'
    })
  }

  if (updateItem.status.value === REQUEST_STATUS.COMPLETED) {
    return res.status(STATUS_CODE.BAD_REQUEST).send({
      message: `You can't update status with completed request`
    });
  }

  if (_.indexOf(requestStatusTypes, status) !== -1) {
    try {
      await requestModel.updateRequestByID(requestId, { status });
      const newUpdatedResult = await requestModel.getItemByIdAsync(requestId);
      const newUpdatedRequest = newUpdatedResult[0];

      if (_.indexOf(ERROR_STATUS_TYPES, newUpdatedRequest.status.value) !== -1) {
        const expiredDate = moment().add(EXPIRATION_DURATION_DAYS, 'days');
        await requestModel.updateRequestByID(requestId, { expiredDate });
        await sendErrorRequestEmail(newUpdatedRequest, expiredDate);
      } else if (newUpdatedRequest.status.value === REQUEST_STATUS.COMPLETED) {
        await requestModel.removeFields(requestId, { expiredDate: 1 });
        await sendCompletedRequestEmail(newUpdatedRequest);
      } else {
        await requestModel.removeFields(requestId, { expiredDate: 1 });
        await sendStandardRequestEmail(newUpdatedRequest);
      }
      res.status(STATUS_CODE.SUCCESS).send({
        message: 'Request status has been updated, mail has been sent successfully'
      });
    } catch (err) {
      return res.status(STATUS_CODE.SERVER_ERROR).send({
        message: 'An error occured while updating request, please try again later',
        err
      })
    }
  } else {
    return res.status(STATUS_CODE.BAD_REQUEST).send({
      message: 'Status type is not valid'
    });
  }
}

async function sendRegisterEmail(addedRequest, req) {
  try {
    const {
      stepchartInfo,
      song,
      email,
      requestId,
      activationToken: { token: activationToken, exp: expiredAt }
    } = addedRequest;
    const { stepchartLevel, stepchartType } = stepchartInfo;

    const title = `[BOSS_PIUVN - UCS Request] - Request ${song.name} ${stepchartType.shortLabel}${(stepchartType.value === 'co-op') ? ` ${stepchartLevel}` : stepchartLevel} has been sent`;

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: title,
      template: 'register_body',
      context: {
        target: addedRequest,
        activationLink: `${req.protocol}://${req.headers.host}/request-activation?id=${requestId}&token=${activationToken}`,
        expiredAt: moment(expiredAt).format('dddd, MMMM Do YYYY, h:mm:ss A Z'),
      }
    }

    const result = await nodemailerTransport.sendMail(mailOptions);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

async function sendTokenEmail(requestItem, updateMode, tokenPayload) {
  try {
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

    const title = `[BOSS_PIUVN - UCS Request] - ${mode} Token for Request: ${song.name} ${stepchartType.shortLabel}${(stepchartType.value === 'co-op') ? ` ${stepchartLevel}` : stepchartLevel}`

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

async function sendErrorRequestEmail(requestItem, expiredDate) {
  try {
    const {
      stepchartInfo,
      song,
      email
    } = requestItem;
    const { stepchartLevel, stepchartType } = stepchartInfo;

    const title = `[BOSS_PIUVN - UCS Request] - Request ${song.name} ${stepchartType.shortLabel}${(stepchartType.value === 'co-op') ? ` ${stepchartLevel}` : stepchartLevel} has error`;

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: title,
      template: 'error_request_body',
      context: {
        target: requestItem,
        expiredDate: moment(expiredDate).format('dddd, MMMM Do YYYY, h:mm:ss A Z')
      }
    }
    const result = await nodemailerTransport.sendMail(mailOptions);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

async function sendCompletedRequestEmail(requestItem) {
  const {
    stepchartInfo,
    song,
    email
  } = requestItem;
  const { stepchartLevel, stepchartType } = stepchartInfo;

  const title = `[BOSS_PIUVN - UCS Request] - Request ${song.name} ${stepchartType.shortLabel}${(stepchartType.value === 'co-op') ? ` ${stepchartLevel}` : stepchartLevel} - Request Completed`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: title,
    template: 'request_completed_body',
    context: {
      target: requestItem
    }
  }

  try {
    const result = await nodemailerTransport.sendMail(mailOptions);
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

async function sendStandardRequestEmail(requestItem) {
  const {
    stepchartInfo,
    song,
    email
  } = requestItem;
  const { stepchartLevel, stepchartType } = stepchartInfo;

  const title = `[BOSS_PIUVN - UCS Request] - Request ${song.name} ${stepchartType.shortLabel}${(stepchartType.value === 'co-op') ? ` ${stepchartLevel}` : stepchartLevel} - Status Changed`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: title,
    template: 'standard_status_request_body',
    context: {
      target: requestItem
    }
  }

  try {
    const result = await nodemailerTransport.sendMail(mailOptions);
    return Promise.resolve(result);
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