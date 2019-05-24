const registerValidateInstance = require('validate.js');
const {values, includes} = require('lodash');
const validateModule = require('../modules/validate').default;
const { STEPCHART_LEVELS, STEPCHART_TYPES, COOP_STEPCHART_TYPES, 
STANDARD_STEPCHART_REQUIREMENT, STANDARD_STEPCHART_LEVELS} = require('../shared/constant');

registerValidateInstance.validators.isValid = function(value, options, key, attributes) {
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
      message: 'Requester is required',
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
      pattern: /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/,
      flags: "i",
      message: "UCS Link is not valid"
    }
  }
};

exports.default = (formValue) => validateModule(formValue, formContraints, registerValidateInstance);