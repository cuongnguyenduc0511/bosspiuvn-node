const validate = require('validate.js');

module.exports.validateForm = (formValue, formConstraints) => {
  let formValidation = validate(formValue, formConstraints, {fullMessages: false});

  for(let k in formValidation) {
    formValidation[k] = formValidation[k] ? {
      errorMessage: formValidation[k][0]
    } : null
  }

//   return Promise.resolve(formValidation);
  return formValidation;
}