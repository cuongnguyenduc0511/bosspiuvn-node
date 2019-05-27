const { isEmpty } = require('lodash');
const { STATUS_CODE } = require('../shared/constant');
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
  console.log(submitData);
  const validation = updateRequestValidation(submitData);
  if (!isEmpty(validation)) {
    return res.status(STATUS_CODE.BAD_REQUEST).send(showValidationErrors(validation));
  }
  req.submitData = submitData;
  next();
}