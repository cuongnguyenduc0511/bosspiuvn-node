$.validator.addMethod("isUrlValid", function (value, element) {
    return this.optional(element) || /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
}, "Invalid Download Link, Please enter valid Download Link");

const formRules = {
    requester: 'required',
    song: 'required',
    stepchartLevel: 'required',
    stepchartType: 'required',
    stepmaker: 'required',
    ucsLink: {
        required: true,
        isUrlValid: true
    },
    email: {
        required: true,
        email: true
    },
    terms: 'required'
};

const formErrorMessages = {
    requester: "Please enter your name / nickname",
    song: "Please choose song",
    stepchartLevel: "Please choose stepchart level",
    stepchartType: "Please choose stepchart type",
    stepmaker: "Please enter STEPMAKER name",
    ucsLink: {
        required: "Please enter UCS Download Link"
    },
    email: {
        required: "Please enter your email",
        email: "Please enter valid email"
    },
    terms: 'Please read and accept the terms'
}

var formValidObj = $("#ucs-register-form").validate({
    rules: formRules,
    messages: formErrorMessages,
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
    highlight: function(element, errorClass, errorClassFormGroup) {
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
    unhighlight: function(element, errorClass, errorClassFormGroup) {
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
    invalidHandler: function (form, validator) {
        if (!validator.numberOfInvalids())
            return;

        window.scrollTo(0, $(validator.errorList[0].element).offset().top - 130);
        $(validator.errorList[0].element).focus();
        return false;
    }
});

$('#reset').click(function() {
    resetForm();
});

function resetForm() {
    formValidObj.resetForm();
    const form = $('#ucs-register-form');
    form.find('input:text, select, textarea').val('');
    form.find('input:radio, input:checkbox').prop('checked', false);
    $('select').val(null).trigger("change");
    requesterNoteInstance.setData('');
}

$('form').each(function () {
    // This will ignore ckeditor jquery validation error when clearing data
    if ($(this).data('validator'))
        $(this).data('validator').settings.ignore = ".ck *";
});

$('select').on("select2:close", function() {
    if (!_.isEmpty(formValidObj.submitted)) {
        $(this).valid();
    }
});

// function clearValidation(formElement){
//     //Internal $.validator is exposed through $(form).validate()
//     var validator = $(formElement).validate();
//     //Iterate through named elements inside of the form, and mark them as error free
//     $('[name]',formElement).each(function(){
//       validator.successList.push(this);//mark as error free
//       validator.showErrors();//remove error messages if present
//     });
//     validator.resetForm();//remove error class on name elements and clear history
//     validator.reset();//remove all error and success data
//    }