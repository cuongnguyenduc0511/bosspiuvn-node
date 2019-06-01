const { isEmpty, isEqual, indexOf, values } = require('lodash');
const { STATUS_CODE, REQUEST_STATUS } = require('../shared/constant');
const { registerValidation , updateRequestValidation } = require('../validations/registerValidation');
const { showValidationErrors } = require('../modules/validate');
const { decodeAndSanitizeObject, decodeAndSanitizeValue } = require('../shared/modules/sanitize')

module.exports.activateRequestMiddleware = (req, res, next) => {
  const { id, token } = req.query;
  if (isEmpty(id) || isEmpty(token)) {
      return res.status(STATUS_CODE.BAD_REQUEST).end(
      `<h2 style="color: red">Request ID / Token is not provided</h2>`
    )
  }
  next();
}

module.exports.registerRequestMiddleware = (req, res, next) => {
  const { requesterNote, ...rest } = req.body;
  const sanitizeData = { ...rest };
  decodeAndSanitizeObject(sanitizeData);
  const submitData = {
    requesterNote,
    ...sanitizeData
  }
  const validation = registerValidation(submitData);
  if (!isEmpty(validation)) {
    return res.status(STATUS_CODE.BAD_REQUEST).send(showValidationErrors(validation));
  }
  submitData.email = String(submitData.email).toLowerCase();
  if (submitData.email === process.env.EMAIL) {
    return res.status(STATUS_CODE.BAD_REQUEST).send({
      message: `This email can not be used, please try another email`
    });
  }
  req.submitData = submitData;
  next();
}

module.exports.updateRequestMiddleware = (req, res, next) => {
  const { requesterNote, ...rest } = req.body;
  const sanitizeData = { ...rest };
  decodeAndSanitizeObject(sanitizeData);
  const submitData = {
    requesterNote,
    ...sanitizeData
  }  
  const validation = updateRequestValidation(submitData);
  if (!isEmpty(validation)) {
    return res.status(STATUS_CODE.BAD_REQUEST).send(showValidationErrors(validation));
  }
  req.submitData = submitData;
  next();
}

module.exports.updateStatusMiddleware = (req, res, next) => {
  const requestId = req.params.id;
  const { status, publishedVideoUrl } = req.body;
  const requestStatusTypes = values(REQUEST_STATUS);

  if (isEmpty(requestId)) {
    return res.status(STATUS_CODE.BAD_REQUEST).send({
      message: 'Request ID required'
    });
  }

  if(indexOf(requestStatusTypes, status) === -1) {
    return res.status(STATUS_CODE.BAD_REQUEST).send({
      message: 'Status type is not valid'
    });
  }

  if(isEqual(status, REQUEST_STATUS.COMPLETED) && isEmpty(publishedVideoUrl)) {
    return res.status(STATUS_CODE.BAD_REQUEST).send({
      message: 'Published video url is required'
    });
  }

  next();
}