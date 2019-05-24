const validate = require('validate.js');
const {isEmpty, values, map} = require('lodash');

exports.default = (formValue, formConstraints, customValidInstance = null) => {
  const validateInstance = !isEmpty(customValidInstance) ? customValidInstance : validate;
  let formValidation = validateInstance(formValue, formConstraints, {fullMessages: false});

  for(let k in formValidation) {
    formValidation[k] = formValidation[k] ? {
      errorMessage: formValidation[k][0]
    } : null
  }

  return formValidation;
}

module.exports.showValidationErrors = (validations) => {
  const messages = values(validations);
  return map(messages, 'errorMessage');
}
