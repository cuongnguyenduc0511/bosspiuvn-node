const requestValidationInstance = require('validate.js');
const {assign, values, includes, omit, merge, pick} = require('lodash');
const validateModule = require('../modules/validate').default;
const { STEPCHART_LEVELS, STEPCHART_TYPES, COOP_STEPCHART_TYPES, 
STANDARD_STEPCHART_REQUIREMENT, STANDARD_STEPCHART_LEVELS} = require('../shared/constant');

requestValidationInstance.validators.isValid = function(value, options, key, attributes) {
  switch(key) {
    case 'stepchartType': {
      const stepchartTypes = values(STEPCHART_TYPES);
      return !includes(stepchartTypes, value) ? options.message : null;    
    };
    case 'stepchartLevel': {
      const { stepchartType } = attributes;
      return !includes(STEPCHART_LEVELS, value) || !isValidStepchartLevel(stepchartType, value) ? options.message : null;    
    }
  }
};

function isValidStepchartLevel(stepchartType, stepchartLevel) {
  if (includes(STANDARD_STEPCHART_REQUIREMENT, stepchartType) && includes(STANDARD_STEPCHART_LEVELS, stepchartLevel)) {
    return true;
  } else if (stepchartType === STEPCHART_TYPES.COOP && includes(COOP_STEPCHART_TYPES, stepchartLevel)) {
    return true;
  }
  return false;
}

const formContraints = {
  requester: {
    presence: {
      message: 'Requester name is required',
      allowEmpty: false
    },
  },
  song: {
    presence: {
      message: 'Song is required',
      allowEmpty: false
    },
  },
  stepchartType: {
    presence: {
      message: 'Stepchart type is required',
      allowEmpty: false
    },
    isValid: {
      message: 'Stepchart type is not valid'
    }
  },
  stepchartLevel: {
    presence: {
      message: 'Stepchart level is required',
      allowEmpty: false
    },
    isValid: {
      message: 'Stepchart level is not valid'
    }
  },
  stepmaker: {
    presence: {
      message: 'Stepmaker is required',
      allowEmpty: false
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
  },
  ucsLink: {
    presence: {
      message: 'UCS Link is required',
      allowEmpty: false
    },
    format: {
      pattern: /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/,
      flags: "i",
      message: "UCS Link is not valid"
    }
  }
};

module.exports.registerValidation = (formValue) => validateModule(formValue, formContraints, requestValidationInstance);

module.exports.updateRequestValidation = (formValue) => {
  const updateSchema = {
    requestId: {
      presence: {
        message: 'Request Id is required',
        allowEmpty: false
      }
    },
    updateToken: {
      presence: {
        message: 'Update token is required',
        allowEmpty: false
      }
    }
  }

  let updateContraints = omit(formContraints, ['song', 'email']);
  updateContraints = merge(updateSchema, updateContraints);

  return validateModule(formValue, updateContraints, requestValidationInstance);
}

module.exports.deleteRequestValidation = (formValue) => {
  const deleteSchema = {
    requestId: {
      presence: {
        message: 'Request Id is required',
        allowEmpty: false
      }
    },
    deleteToken: {
      presence: {
        message: 'Delete token is required',
        allowEmpty: false
      }
    }
  }

  let deleteContraints = pick(formContraints, ['email']);
  deleteContraints = merge(deleteSchema, deleteContraints);
  return validateModule(formValue, deleteContraints, requestValidationInstance);

}

module.exports.resendActivationValidation = (formValue) => {
  const resendSchema = {
    requestId: {
      presence: {
        message: 'Request Id is required',
        allowEmpty: false
      }
    }
  }

  let resendContraints = assign({}, { email: formContraints.email });
  resendContraints = merge(resendSchema, resendContraints);

  return validateModule(formValue, resendContraints, requestValidationInstance);
}