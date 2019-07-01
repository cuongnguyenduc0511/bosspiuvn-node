const { userValidation } = require('../validations/userValidation');
const { showValidationErrors } = require('../modules/validate');
const { decodeAndSanitizeObject, decodeAndSanitizeValue } = require('../shared/modules/sanitize')
const { isEmpty, assign } = require('lodash');
const { STATUS_CODE } = require('../shared/constant');

module.exports.userMiddleware = (req, res, next) => {
  const { username, password, nickName } = req.body;
  const sanitizeData = { username, nickName };
  decodeAndSanitizeObject(sanitizeData);
  const submitData = assign({ password }, sanitizeData);
  const validation = userValidation(submitData);
  if (!isEmpty(validation)) {
    return res.status(STATUS_CODE.BAD_REQUEST).send(showValidationErrors(validation));
  }
  req.submitData = submitData;
  next();
}
