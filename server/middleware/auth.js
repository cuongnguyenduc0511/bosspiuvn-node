const { authenticationValidation } = require('../validations/authValidation');
const { showValidationErrors } = require('../modules/validate');
const { decodeAndSanitizeObject, decodeAndSanitizeValue } = require('../shared/modules/sanitize')
const { isEmpty } = require('lodash');
const { STATUS_CODE } = require('../shared/constant');

module.exports.authMiddleware = (req, res, next) => {
  const { username, password } = req.body;
  const submitData = { username, password };
  decodeAndSanitizeValue(submitData.username);
  const validation = authenticationValidation(submitData);
  if (!isEmpty(validation)) {
    return res.status(STATUS_CODE.BAD_REQUEST).send(showValidationErrors(validation));
  }
  req.submitData = submitData;
  next();
}
