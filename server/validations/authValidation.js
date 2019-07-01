const authValidationInstance = require('validate.js');
const validateModule = require('../modules/validate').default;

const formContraints = {
  username: {
    presence: {
      message: 'Username is required',
      allowEmpty: false
    },
    length: {
      minimum: 6,
      message: `Username must be at least 6 characters`
    }
  },
  password: {
    presence: {
      message: 'Password is required',
      allowEmpty: false
    },
    length: {
      minimum: 6,
      message: `Password must be at least 6 characters`
    }
  }
};

module.exports.authenticationValidation = (formValue) => {
  return validateModule(formValue, formContraints, authValidationInstance);
}