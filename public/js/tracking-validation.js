var formObjs = [];

$.validator.addMethod("isUrlValid", function (value, element) {
  return this.optional(element) || /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
}, "Invalid Download Link, Please enter valid Download Link");

$.validator.addMethod("isEmailValid", function (value, element) {
  return this.optional(element) || /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
}, "Please enter valid email");

var tokenForm = {
  rules: {
    email: {
      required: true,
      isEmailValid: true,
      maxlength: 63,
    }
  },
  errMsgs: {
    email: {
      required: "Please enter your email",
    }
  }
}

var resendForm = {
  rules: {
    resendEmail: {
      required: true,
      isEmailValid: true,
      maxlength: 63,
    }
  },
  errMsgs: {
    resendEmail: {
      required: "Please enter your email",
    }
  }
}

var deleteForm = {
  rules: {
    confirmEmail: {
      required: true,
      isEmailValid: true,
      maxlength: 63,
    },
    deleteToken: 'required'
  },
  errMsgs: {
    confirmEmail: {
      required: "Please enter your email",
    },
    deleteToken: 'Please enter delete token'
  }
}

var updateForm = {
  rules: {
    requester: 'required',
    updateStepchartLevel: 'required',
    updateStepchartType: 'required',
    stepmaker: 'required',
    ucsLink: {
      required: true,
      isUrlValid: true
    },
    updateToken: 'required'
  },
  errMsgs: {
    requester: "Please enter your name / nickname",
    updateStepchartLevel: "Please choose stepchart level",
    updateStepchartType: "Please choose stepchart type",
    stepmaker: "Please enter STEPMAKER name",
    ucsLink: {
      required: "Please enter UCS Download Link"
    },
    updateToken: 'Please enter update token'
  }
}

var forms = {
  token: tokenForm,
  resend: resendForm,
  delete: deleteForm,
  update: updateForm
}

function initModalFormValidation() {
  $('.bss-form').each(function (index, targetFormElem) {
    var _targetFormElem = $(targetFormElem);
    var identifier = _targetFormElem.attr('mode') || 'token';
    var targetForm = _.get(forms, identifier);
    var formRules = _.get(targetForm, 'rules');
    var formErrMsg = _.get(targetForm, 'errMsgs');
    if (!formObjs[identifier]) {
      formObjs[identifier] = _targetFormElem.validate({
        onfocusout: function (element) {
          return
        },
        rules: formRules,
        messages: formErrMsg,
        errorElement: "div",
        errorClass: 'is-invalid',
        errorClassFormGroup: 'has-danger is-focused',
        errorPlacement: function (error, element) {
          // Add the `help-block` class to the error element
          error.addClass("invalid-feedback");
  
          if (element.prop("type") === "checkbox") {
            error.insertAfter(element.next());
          }
          else {
            if (!element.hasClass("form-control") && element.is('select')) {
              error.insertAfter(element.next());
              // element.next().append(error);
            } else {
              error.insertAfter(element);
            }
          }
        },
        highlight: function (element, errorClass, errorClassFormGroup) {
          const targetElem = $(element);
  
          targetElem.parents('.form-group').find('.col-form-label').addClass('label-invalid');
  
          if (!targetElem.is('select') || (targetElem.hasClass('form-control') && targetElem.is('select'))) {
            targetElem.parents('.form-group').addClass(errorClassFormGroup);
            targetElem.addClass(errorClass);
          } else if (targetElem.hasClass('b-select2') && targetElem.is('select')) {
            const select2Elem = targetElem.next().find("span[aria-labelledby='select2-" + targetElem.attr('id') + "-container']");
            select2Elem.addClass('select2-invalid');
          }
        },
        unhighlight: function (element, errorClass, errorClassFormGroup) {
          const targetElem = $(element);
  
          targetElem.parents('.form-group').find('.col-form-label').removeClass('label-invalid');
  
          if (!targetElem.is('select') || (targetElem.hasClass("form-control") && targetElem.is('select'))) {
            targetElem.parents(".form-group").removeClass(errorClassFormGroup);
            targetElem.removeClass(errorClass);
          } else if (targetElem.hasClass("b-select2") && targetElem.is('select')) {
            const select2Elem = targetElem.next().find("span[aria-labelledby='select2-" + targetElem.attr('id') + "-container']");
            select2Elem.removeClass('select2-invalid');
          }
        },
        submitHandler: function (form) {
          return false;
        }
      })  
    }
  });

  $('form').each(function () {
    // This will ignore ckeditor jquery validation error when clearing data
    if ($(this).data('validator'))
      $(this).data('validator').settings.ignore = ".ck *";
  });
}

function resetForm({ targetForm = null, currentMode = null } = {}) {
  console.log('resetForm');
  if (_.isEmpty(targetForm)) {
    const forms = $('#update-request-modal').find('form');
    Array.of(forms).forEach(function (form) {
      form.find('input:text, select, textarea').val('');
      form.find('input:radio, input:checkbox').prop('checked', false);
      form.find('select').val('').trigger("change");
    });

    // Clear all textarea value;
    Object.keys(editors).forEach((key) => {
      editors[key].setData('');
    });

    Object.keys(formObjs).forEach((key) => {
      if (formObjs[key].currentForm !== undefined) {
        formObjs[key].resetForm();
      }
    })
  } else {
    let targetFormObjKey;
    targetForm.find('input:text, select, textarea').val('');
    targetForm.find('input:radio, input:checkbox').prop('checked', false);
    targetForm.find('select').val('').trigger("change");
    clearAllTextArea(targetForm);
    switch (currentMode) {
      case UPDATE_MODE: targetFormObjKey = UPDATE_MODE.toLowerCase(); break;
      case DELETE_MODE: targetFormObjKey = DELETE_MODE.toLowerCase(); break;
      case RESEND_ACTIVATION: targetFormObjKey = RESEND_ACTIVATION.toLowerCase(); break;
      default: targetFormObjKey = 'token';
    }
    formObjs[targetFormObjKey].resetForm();
  }
}

function toggleTextArea(isReadOnly, form) {
  const textAreaInstances = form.find('textarea');
  if (textAreaInstances.length > 0) {
    textAreaInstances.each(function () {
      const textAreaKey = this.name;
      editors[textAreaKey].isReadOnly = isReadOnly;
    });
  }
}

function clearAllTextArea(form) {
  const textAreaInstances = form.find('textarea');
  if (textAreaInstances.length > 0) {
    textAreaInstances.each(function () {
      const textAreaKey = this.name;
      editors[textAreaKey].setData('');
    });
  }
}