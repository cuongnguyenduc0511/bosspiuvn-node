const requestModel = require('../models/request');
const { randomString } = require('../shared/modules/randomString');
const { isEmpty, indexOf } = require('lodash');
const { requestMessages } = require('../shared/response_messages');
const { ID_LENGTH, STATUS_CODE, UPDATE_MODE, REQUEST_STATUS, ERROR_STATUS_TYPES, EXPIRATION_DURATION_DAYS } = require('../shared/constant');
const { generateToken, generateActivationToken } = require('../modules/tokenModules');
const moment = require('moment');
const { sendTokenEmail, sendRegisterEmail, sendStatusEmail } = require('./requestEmail');
const paginationModule = require('../shared/modules/pagination');

module.exports.getRequestById = async (req, res) => {
  const { id: requestId } = req.params;
  const result = await requestModel.getItemById(requestId);
  if (isEmpty(result)) {
    return res.send({
      message: 'Result not found'
    }) 
  }
  res.send({
    ...result
  })
}

module.exports.getRequests = async (req, res) => {
  try {
    const paginationResult = await paginationModule.getData(req, res, requestModel);
    let statusCode = !isEmpty(paginationResult.items) && paginationResult.items.length > 0 ? 200 : 404;
    res.status(statusCode).send(paginationResult);
  } catch (err) {
    const errorStatus = err.status || STATUS_CODE.SERVER_ERROR;
    console.log(err);
    res.status(errorStatus).send({
      message: 'An error occurred while fetching data, please try again later',
      err
    });
  }
};

module.exports.activateRequest = async (req, res) => {
  const { id: requestId, token: submitToken } = req.query;
  let activateTokenSession = null;
  try {
    activateTokenSession = await requestModel.startSession();
    activateTokenSession.startTransaction();

    const requestItem = await requestModel.getItemById(requestId, true);
    if (isEmpty(requestItem)) {
      return res.status(STATUS_CODE.NOT_FOUND).send(
        `<h2 style="color: red">Wrong Request ID / Request ID does not exist</h2>`
      )
    }

    const { isActivated: isRequestActivated, activationToken: { token: requestItemToken } } = requestItem;

    if (isRequestActivated) {
      return res.status(STATUS_CODE.SUCCESS).send(
        `<h2 style="color: blue">Request ID: ${requestId} is already activated</h2>`
      )
    }

    if (submitToken === requestItemToken && !isRequestActivated) {
      await requestModel.updateRequestByID(requestId, { 
        $unset: { activationToken: 1 }, 
        $set: { isActivated: true, status: REQUEST_STATUS.PENDING }
      });
      await activateTokenSession.commitTransaction();
      activateTokenSession.endSession();  
      res.status(STATUS_CODE.SUCCESS).send(
        `<h2 style="color: green">Request id: ${requestId} has been successfully activated</h2>`
      )
    } else {
      return res.status(STATUS_CODE.BAD_REQUEST).send(
        `<h2 style="color: red">Activate token does not match for request Id: ${requestId}</h2>`
      )
    }
  } catch (err) {
    console.log(err);
    await activateTokenSession.abortTransaction();
    activateTokenSession.endSession();
    return res.status(STATUS_CODE.SERVER_ERROR).send({
      message: 'An error occurred while activating token, Please try again later',
      err: err || err.message
    })
  }
}

module.exports.resendActivationEmail = async (req, res) => {
  try {
    const { requestId, email: submitEmail } = req.submitData;
    console.log(submitEmail);
    const requestItem = await requestModel.getItemById(requestId, true);
    if (isEmpty(requestItem)) {
      return res.status(STATUS_CODE.BAD_REQUEST).send({
        message: 'Id does not exist / It could have been deleted'
      });
    }

    if (requestItem.email !== submitEmail) {
      return res.status(STATUS_CODE.BAD_REQUEST).send({
        message: 'Wrong email, please type your valid email'
      });
    }

    // TODO: add send email
    await sendRegisterEmail(requestItem, req);
    res.status(STATUS_CODE.SUCCESS).send({
      message: 'Your request has been sent, please check your email',
    })
  } catch (err) {
    console.log(err);
    res.status(STATUS_CODE.SERVER_ERROR).send({
      message: 'An error occurred while resending activation email, please try again later',
      err
    });
  }
};

module.exports.registerNewRequest = async (req, res) => {
  let registerRequestSession = null;
  try {
    registerRequestSession = await requestModel.startSession();
    registerRequestSession.startTransaction();
    const requestId = await generateRequestId();

    const {
      stepchartLevel, stepchartType, song,
      contentName, stepmaker, requester,
      ucsLink, email, requesterNote
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
        exp: moment().add(3, 'days')
      },
      email
    }
    const addedDoc = await requestModel.addData(submitData);
    await sendRegisterEmail(addedDoc, req);
    await registerRequestSession.commitTransaction();
    registerRequestSession.endSession();
    res.status(STATUS_CODE.SUCCESS).send({
      message: `Your request has been sent, please check your email: ${addedDoc.email} to activate your request`
    });
  } catch (err) {
    await registerRequestSession.abortTransaction();
    registerRequestSession.endSession();
    const { status, error } = err;
    const statusCode = status || STATUS_CODE.SERVER_ERROR;
    return res.status(statusCode).send({
      message: requestMessages.REGISTER_ERROR,
      err: error || err
    });
  }
}

module.exports.requestToken = async (req, res) => {
  const { email: submitEmail, mode, requestId } = req.submitData;

  let createTokenSession = null;
  try {
    createTokenSession = await requestModel.startSession();
    createTokenSession.startTransaction();
    const requestItem = await requestModel.getItemById(requestId, true);
    if (isEmpty(requestItem)) {
      return res.status(STATUS_CODE.NOT_FOUND).send({
        message: 'Request Id Not Found'
      })
    }

    if (submitEmail === requestItem.email) {
      const tokenPayload = generateToken();
      const updateResult = await sendToken(requestItem, mode, tokenPayload);
      await createTokenSession.commitTransaction();
      createTokenSession.endSession();

      const { updateMode, registeredEmail } = updateResult;
      res.status(STATUS_CODE.SUCCESS).send({
        message: `Your ${updateMode} token has been sent to your email: ${registeredEmail}`
      })
    } else {
      return res.status(STATUS_CODE.BAD_REQUEST).send({
        message: 'Wrong email, please type your valid email'
      });
    }
  } catch (err) {
    console.log(err);
    await createTokenSession.abortTransaction();
    createTokenSession.endSession();
    return res.status(STATUS_CODE.SERVER_ERROR).send({
      message: 'An error occurred while requesting token, Please try again later',
      err
    });
  }
}

module.exports.updateRequestByToken = async (req, res) => {
  const { getItemById, updateRequestByID, removeToken, startSession } = requestModel;
  let updateRequestClientSession = await startSession();
  try {
    updateRequestClientSession.startTransaction();
    const {
      requestId,
      stepchartType,
      stepchartLevel,
      requester,
      stepmaker,
      ucsLink,
      contentName,
      requesterNote,
      updateToken: submitUpdateToken
    } = req.submitData;

    const requestItem = await getItemById(requestId, true);

    if (isEmpty(requestItem)) {
      return res.status(STATUS_CODE.NOT_FOUND).send({
        message: 'Request Id Not Found'
      });
    }

    if (isEmpty(requestItem.updateToken)) {
      return res.status(STATUS_CODE.BAD_REQUEST).send({
        message: 'Please request update token'
      });
    }

    if (submitUpdateToken === requestItem.updateToken.token) {
      const timeSubmit = moment();
      const expiredTokenTime = moment(requestItem.updateToken.exp);
      if (timeSubmit.isBefore(expiredTokenTime)) {

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
        await updateRequestByID(requestId, { $set: updateData, $unset: { expiredDate: 1 } });
        await updateRequestClientSession.commitTransaction();
        updateRequestClientSession.endSession();
        res.status(STATUS_CODE.SUCCESS).send({
          message: 'Congratulations, your request has been successfully updated'
        });
      } else {
        // Remove Update Token
        await removeToken(requestId, UPDATE_MODE.UPDATE);
        await updateRequestClientSession.commitTransaction();
        updateRequestClientSession.endSession();
        res.status(STATUS_CODE.BAD_REQUEST).send({
          message: 'Token has been expired, please request new token'
        });
      }
    } else {
      return res.status(STATUS_CODE.BAD_REQUEST).send({
        message: 'Wrong token, please type your valid token'
      });
    }
  } catch (err) {
    await updateRequestClientSession.abortTransaction();
    updateRequestClientSession.endSession();
    res.status(STATUS_CODE.SERVER_ERROR).send({
      message: 'An error occurred while updating request, Please try again later'
    })
  }
}

module.exports.deleteRequestByToken = async (req, res) => {
  const { requestId, email: submitEmail, deleteToken } = req.submitData;
  let deleteRequestSession;
  try {
    deleteRequestSession = await requestModel.startSession();
    deleteRequestSession.startTransaction();
    const requestItem = await requestModel.getItemById(requestId, true);
    if (isEmpty(requestItem)) {
      return res.status(STATUS_CODE.BAD_REQUEST).send({
        message: 'Request ID does not exist'
      });
    }

    if(isEmpty(requestItem.deleteToken)) {
      return res.status(STATUS_CODE.BAD_REQUEST).send({
        message: 'Please request delete token'
      });
    }

    if (submitEmail === requestItem.email && deleteToken === requestItem.deleteToken.token) {
      const timeSubmit = moment();
      const tokenExpirationDate = moment(requestItem.deleteToken.exp);
      if (timeSubmit.isBefore(tokenExpirationDate)) {
        // Delete Success
        await requestModel.deleteRequestByID(requestId);
        await deleteRequestSession.commitTransaction();
        deleteRequestSession.endSession();
        res.status(STATUS_CODE.SUCCESS).send({
          message: 'Congratulations, your request has been successfully deleted'
        });
      } else {
        // Remove Delete Token
        await requestModel.removeToken(requestId, UPDATE_MODE.DELETE);
        await deleteRequestSession.commitTransaction();
        deleteRequestSession.endSession();
        res.status(STATUS_CODE.BAD_REQUEST).send({
          message: 'Token has been expired, please request new token'
        });
      }
    } else {
      return res.status(STATUS_CODE.BAD_REQUEST).send({
        message: 'Wrong email / token, please type your valid email / token'
      });
    }
  } catch (err) {
    console.log(err);
    await deleteRequestSession.abortTransaction();
    deleteRequestSession.endSession();
    return res.status(STATUS_CODE.SERVER_ERROR).send({
      message: 'An error occured while deleting request, please try again later',
      err
    })
  }
}

module.exports.updateRequestStatus = async (req, res) => {
  const { status, publishedVideoUrl } = req.body;
  const { id: requestId } = req.params;
  let updateStatusSession = null;
  let newUpdatedRequestResult;
  try {
    updateStatusSession = await requestModel.startSession();
    updateStatusSession.startTransaction();

    const updateItem = await requestModel.getItemById(requestId, true);

    if (isEmpty(updateItem)) {
      return res.status(STATUS_CODE.BAD_REQUEST).send({
        message: 'Request ID does not exist'
      })
    }

    if (updateItem.status.value === REQUEST_STATUS.COMPLETED) {
      return res.status(STATUS_CODE.BAD_REQUEST).send({
        message: `You can't update status with completed request`
      });
    }
    if (indexOf(ERROR_STATUS_TYPES, status) !== -1) {
      const expiredDate = moment().add(EXPIRATION_DURATION_DAYS, 'days');
      newUpdatedRequestResult = await requestModel.updateRequestByID(requestId, { $set: { expiredDate, status } });
    } else if (status === REQUEST_STATUS.COMPLETED) {
      newUpdatedRequestResult = await requestModel.updateRequestByID(requestId, { $set: { publishedVideoUrl, status }, $unset: { expiredDate: 1 } });
    } else {
      newUpdatedRequestResult = await requestModel.updateRequestByID(requestId, { $set: { status } });
    }
    await sendStatusEmail(newUpdatedRequestResult, status);
    await updateStatusSession.commitTransaction();
    updateStatusSession.endSession();
    res.status(STATUS_CODE.SUCCESS).send({
      message: 'Request status has been updated, mail has been sent successfully'
    });
  } catch (err) {
    console.log(err);
    await updateStatusSession.abortTransaction();
    updateStatusSession.endSession();
    return res.status(STATUS_CODE.SERVER_ERROR).send({
      message: 'An error occured while updating request, please try again later',
      err
    })
  }
}

async function generateRequestId() {
  const randomId = randomString(ID_LENGTH);
  try {
    const result = await requestModel.getItemById(randomId);
    if (!isEmpty(result)) {
      generateRequestId();
    } else {
      return Promise.resolve(randomId);
    }
  } catch (err) {
    return Promise.reject(err);
  }
}

async function sendToken(requestItem, updateMode, tokenPayload) {
  let mode;
  try {
    let updateData = {};
    const { requestId } = requestItem;
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
    const updatedItem = await requestModel.updateRequestByID(requestId, { $set: updateData });
    const result = await sendTokenEmail(updatedItem, { mode, tokenPayload });
    return Promise.resolve(result);
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
}

