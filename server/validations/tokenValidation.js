const tokenValidationInstance = require('validate.js');
const { values, includes } = require('lodash');
const validateModule = require('../modules/validate').default;
const { UPDATE_MODE } = require('../shared/constant');

tokenValidationInstance.validators.isValid = function (value, options, key, attributes) {
  switch (key) {
    case 'mode': {
      const updateModes = values(UPDATE_MODE);
      return !includes(updateModes, value) ? options.message : null;
    };
  }
};

const formContraints = {
  requestId: {
    presence: {
      message: 'Request Id is required',
      allowEmpty: false
    },
  },
  mode: {
    presence: {
      message: 'Update mode is required',
      allowEmpty: false
    },
    isValid: {
      message: 'Update mode is not valid'
    }
  },
  email: {
    presence: {
      message: 'Email is required',
      allowEmpty: false
    },
    format: {
      pattern: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      flags: "i",
      message: "Email is not valid"
    }
  }
};

exports.default = (formValue) => validateModule(formValue, formContraints, tokenValidationInstance);