const userValidationInstance = require('validate.js');
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
  },
  nickName: {
    presence: {
      message: 'Nickname is required',
      allowEmpty: false
    },
    length: {
      minimum: 1,
      message: `Nickname must be at least 1 characters`
    }
  }
};

module.exports.userValidation = (formValue) => {
  return validateModule(formValue, formContraints, userValidationInstance);
}