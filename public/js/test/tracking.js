var baseUrl = window.location.protocol + '//' + window.location.host;
var apiUrl = baseUrl + '/api'
var REQUEST_TIME_OUT = 10000;
var forms, formObjs = [];

function initTextArea() {
  try {
    return Promise.resolve(
      tinymce.init({
        selector: '#requester_note',
        menubar: false,
        statusbar: false,
        height: 350
      }))
  } catch (err) {
    return Promise.reject(err);
  }
}

function getCommonData() {
  return axios.get(apiUrl + '/commons', {
    timeout: REQUEST_TIME_OUT
  });
}

function getRequestList(params = null) {
  let axiosInstance = null;
  switch (typeof params) {
    case 'object':
      axiosInstance = axios.get(apiUrl + '/requests', {
        params,
        timeout: REQUEST_TIME_OUT,
      }); break;
    default: axiosInstance = axios.get(`${apiUrl}/requests${params}`, {
      timeout: REQUEST_TIME_OUT,
    }); break;
  }
  return axiosInstance;
}

var ucsTrackingAppModule = angular.module('ucsTrackingApp', []);

ucsTrackingAppModule.controller('ucsTrackingAppCtrl', function ($scope, $http, $q, $timeout) {
  $scope.isFullyLoaded = false;
  $scope.isFirstLoadFail = false;
  $scope.requestTokenForm = {};
  $scope.searchForm = {};
  $scope.updateForm = {};
  $scope.deleteForm = {};
  $scope.resendForm = {};
  $scope._csrf = $('input[name="_csrf"]').val();

  var fetchData = function () {
    return Promise.resolve($q.when(axios.all([getCommonData(), getRequestList()])).then(axios.spread(function (commonData, requestData) {
      // Both requests are now complete
      var commonDataResult = commonData.data;
      var requestPaginationResult = requestData.data;
      $scope.isFetchingRequestTimeout = false;
      return {
        common: commonDataResult,
        requestPagination: requestPaginationResult
      }
    })).catch(function (error) {
      console.log(error.response || error);
      if (error.code === 'ECONNABORTED') {
        console.log('Timeout');
        $scope.isFetchingRequestTimeout = true;
      } else {
        $scope.isError = true;
      }
      return Promise.reject(error);
    })
    )
  }

  function firstLoad() {
    // Promise.all([fetchData()]).then(function (data) {
    //   var commonData = data[0].common;
    //   var trackingResult = data[0].requestPagination;

    //   $scope.trackingResult = trackingResult.paginationResult;
    //   $scope.standardStepLevels = commonData.stepchartLevels.standard;
    //   $scope.coopStepLevels = commonData.stepchartLevels.coop;

    //   $scope.searchFormStepchartTypes = commonData.stepchartTypes;
    //   $scope.searchFormStepchartLevels = _.concat($scope.standardStepLevels, $scope.coopStepLevels);

    //   $scope.updateFormStepchartTypes = commonData.stepchartTypes;

    //   var currentPage = $scope.trackingResult.currentPage;
    //   var totalPages = $scope.trackingResult.totalPages;
    //   $scope.leftPaginationItems = generateItemsOfPaginationLeft(currentPage);
    //   $scope.rightPaginationItems = generateItemsOfPaginationRight(currentPage, totalPages);

    //   $scope.isFullyLoaded = true;
    //   $scope.$digest();
    //   $('.sec-request-list').show();
    // }).catch(function (error) {
    //   console.log(error.response || error);
    // });
    if ($scope.isFirstLoadFail) {
      // Show loading modal
      Swal({
        title: 'Please wait',
        onBeforeOpen: () => {
          Swal.showLoading();
        },
        showConfirmButton: false,
        allowOutsideClick: false
      });
    }

    Promise.resolve(fetchData()).then(function (data) {
      var commonData = data.common;
      var trackingResult = data.requestPagination;

      $scope.trackingResult = trackingResult.paginationResult;
      $scope.standardStepLevels = commonData.stepchartLevels.standard;
      $scope.coopStepLevels = commonData.stepchartLevels.coop;

      $scope.searchFormStepchartTypes = commonData.stepchartTypes;
      $scope.searchFormStepchartLevels = _.concat($scope.standardStepLevels, $scope.coopStepLevels);

      $scope.updateFormStepchartTypes = commonData.stepchartTypes;

      var currentPage = $scope.trackingResult.currentPage;
      var totalPages = $scope.trackingResult.totalPages;
      $scope.leftPaginationItems = generateItemsOfPaginationLeft(currentPage);
      $scope.rightPaginationItems = generateItemsOfPaginationRight(currentPage, totalPages);

      $scope.isFullyLoaded = true;
      $scope.$digest();
      $('.sec-request-list').show();
    }).catch(function (error) {
      console.log(error.response || error);
      $scope.isFirstLoadFail = true;
    }).finally(function () {
      if ($scope.isFirstLoadFail) {
        // Show loading modal
        Swal.hideLoading();
        Swal.close();
      }
    });
  }

  $scope.$on('reloadCurrent', function () {
    var queryParams = $scope.trackingResult.query.params;

    const newQueryParams = {
      stepchart_type: queryParams.stepchart_type,
      stepchart_level: queryParams.stepchart_level,
      search: queryParams.search,
      item_per_page: queryParams.item_per_page,
      page: queryParams.currentPage
    }

    fetchRequestList(newQueryParams);
  })

  $scope.onReload = function (event) {
    if (!$scope.isFullyLoaded) {
      firstLoad();
    } else {
      var params = $scope.searchForm;
      fetchRequestList(params);
    }
  }

  $scope.openModal = function (event) {
    var targetButton = $(event.currentTarget);
    var currentMode = targetButton.attr('mode');
    $scope.targetRequest = targetButton.attr('request');
    switch (currentMode) {
      case 'update': {
        $scope.modalInstance = {
          title: 'Update Request',
          mode: 'update',
          tokenMode: 'Update',
          submitButton: {
            iconClass: 'fa-edit',
            buttonClass: 'btn-primary',
            title: 'Update'
          }
        }
        break;
      }
      case 'delete': {
        $scope.modalInstance = {
          title: 'Delete Request',
          mode: 'delete',
          tokenMode: 'Delete',
          submitButton: {
            iconClass: 'fa-trash-alt',
            buttonClass: 'btn-danger',
            title: 'Delete'
          }
        }
        break;
      }
      case 'resend': {
        $scope.modalInstance = {
          title: 'Resend Activation Email',
          mode: 'resend',
          submitButton: {
            iconClass: 'fa-arrow-circle-right',
            buttonClass: 'btn-primary',
            title: 'Resend Email'
          }
        }
        break;
      }
    }
    $('#update-modal').modal('show');
    setTimeout(function () {
      initTextArea();
      initModalFormValidation();
    }, 200)
  }

  $scope.onSearch = function (event) {
    event.preventDefault();
    var params = $scope.searchForm;
    fetchRequestList(params);
  }

  $(document).on('click', '#token-submit', function () {
    var targetForm = $('#request-token-form');
    if (targetForm.valid()) {
      var targetRequest = $scope.targetRequest;
      var csrfToken = $scope._csrf;
      var updateMode = $scope.modalInstance.tokenMode;
      var submitData = {
        _csrf: csrfToken,
        mode: updateMode,
        requestId: targetRequest,
        email: $scope.requestTokenForm.email
      }

      // Show loading modal
      Swal({
        title: 'Your request is processing',
        onBeforeOpen: () => {
          Swal.showLoading();
        },
        showConfirmButton: false,
        allowOutsideClick: false
      });

      $q.when(axios.post(baseUrl + '/request-token', submitData)).then(function (response) {
        $timeout(function () {
          Swal.hideLoading();
          Swal.close();
          Swal({
            title: 'Congratulations!',
            text: response.data.message,
            type: 'success',
            allowOutsideClick: false,
            confirmButtonText: 'OK'
          }).then(function () {
            resetForm(targetForm);
          });
        }, 2000);
      }).catch(function (error) {
        var errorResponse = error.response;
        Swal({
          title: 'Oof...',
          text: !_.isEmpty(errorResponse) ? (errorResponse.data.message || '') : error,
          type: 'error',
          allowOutsideClick: false
        });
      });

    } else {
      console.log('not valid');
    }
  });

  $('#submit').click(function () {
    var updateMode = $scope.modalInstance.mode;
    var targetForm = $('#' + updateMode + '-form');
    if (!targetForm) {
      return;
    }

    if ($scope.modalInstance.mode === 'update') {
      $scope.updateForm.requesterNote = tinymce.get('requester_note').getContent();
    }

    if (targetForm.valid()) {
      var formData = $scope[updateMode + 'Form'];
      var submitData = _.assign({ _csrf: $scope._csrf, requestId: $scope.targetRequest }, formData);
      console.log(submitData);
      // Show loading modal
      Swal({
        title: 'Your request is processing',
        onBeforeOpen: () => {
          Swal.showLoading();
        },
        showConfirmButton: false,
        allowOutsideClick: false
      });

      var requestUrl;
      switch (updateMode) {
        case 'update':
          requestUrl = baseUrl + '/update-request';
          break;
        case 'delete':
          requestUrl = baseUrl + '/delete-request';
          break;
        case 'resend':
          requestUrl = baseUrl + '/resend-activation';
          break;
      }

      $q.when(axios.post(requestUrl, submitData)).then(function (response) {
        $timeout(function () {
          $('#update-modal').modal('hide');
          Swal.hideLoading();
          Swal.close();
          Swal({
            title: 'Congratulations!',
            text: response.data.message,
            type: 'success',
            allowOutsideClick: false,
            confirmButtonText: 'OK'
          }).then(function () {
            //Reload list
            if (updateMode !== 'resend') {
              $scope.$emit('reloadCurrent');
            }
          })
        }, 2000);
      }).catch(function (error) {
        var errorResponse = error.response;
        Swal({
          title: 'Whoops!!',
          text: !_.isEmpty(errorResponse) ? (errorResponse.data.message || '') : error,
          type: 'error',
          allowOutsideClick: false
        })
      });
    }
  });

  $scope.onFormReset = function (event) {
    event.preventDefault();
    var updateMode = $(event.currentTarget).attr('mode');
    var targetForm = $('#' + updateMode + '-form');
    if (targetForm) {
      resetForm(targetForm);
    }
  }

  $scope.onRequestTokenFormReset = function (event) {
    var targetForm = $('#request-token-form');
    if (targetForm) {
      resetForm(targetForm);
    }
  }

  $scope.changePage = function (event) {
    var targetPage = event.target.getAttribute('page');
    var queryParams = $scope.trackingResult.query.params;

    const newQueryParams = {
      stepchart_type: queryParams.stepchart_type,
      stepchart_level: queryParams.stepchart_level,
      search: queryParams.search,
      item_per_page: queryParams.item_per_page,
      page: targetPage
    }

    fetchRequestList(newQueryParams);
  }

  function fetchRequestList(params) {
    $('.sec-request-list').hide();

    // Show loading modal
    Swal({
      title: 'Please wait',
      onBeforeOpen: () => {
        Swal.showLoading();
      },
      showConfirmButton: false,
      allowOutsideClick: false
    });

    //set to false;
    $scope.isFetchingRequestTimeout = false;
    $scope.isError = false;
    $scope.isNotFound = false;

    $q.when(getRequestList(params)).then(function (requestData) {
      var trackingResult = requestData.data;
      switch (trackingResult.code) {
        case 'NOT_FOUND': {
          $scope.isNotFound = true;
          $scope.trackingResult = null;
          break;
        }
        case 'RESULT_FOUND': {
          $scope.trackingResult = trackingResult.paginationResult;
          var currentPage = $scope.trackingResult.currentPage;
          var totalPages = $scope.trackingResult.totalPages;
          $scope.leftPaginationItems = generateItemsOfPaginationLeft(currentPage);
          $scope.rightPaginationItems = generateItemsOfPaginationRight(currentPage, totalPages);
          $('.sec-request-list').show();
          break;
        }
      }
    }).catch(function (error) {
      // console.log(error.response || error);
      if (error.code === 'ECONNABORTED') {
        console.log('Timeout');
        $scope.isFetchingRequestTimeout = true;
      } else {
        $scope.isError = true;
      }
    }).finally(function () {
      Swal.hideLoading();
      Swal.close();
      window.scrollTo(0, $('#search-form').offset().top);
    })
  }

  $(function () {
    // On load
    firstLoad();

    $('#search-form').find('.form-control').each(function (index, elem) {
      $(elem).focus(function () {
        $(elem).addClass('active');
        $(elem).prev().addClass('active');
      })

      $(elem).blur(function () {
        $(elem).removeClass('active');
        $(elem).prev().removeClass('active');
      })
    });

    $('#update-modal').find('form').each(function (index, formElem) {
      $(formElem).find('.form-control').each(function (index, inputElem) {
        $(inputElem).focus(function () {
          $(inputElem).addClass('active');
          $(inputElem).prev().addClass('active');
        })

        $(inputElem).blur(function () {
          $(inputElem).removeClass('active');
          $(inputElem).prev().removeClass('active');
        })
      });
    });

    $('#search-form label').click(function (e) {
      e.preventDefault();
    })

    $('select[id="search-form-step-type"]').change(function () {
      var selectedType = $(this).val(),
        coopStepchartLevels = $scope.coopStepLevels,
        standardStepchartLevels = $scope.standardStepLevels;
      switch (selectedType) {
        case 'co-op':
          if ($scope.searchFormStepchartLevels !== coopStepchartLevels) {
            $scope.searchFormStepchartLevels = coopStepchartLevels;
          }
          break;
        case '': {
          $scope.searchFormStepchartLevels = _.concat(standardStepchartLevels, coopStepchartLevels);
          break;
        }
        default:
          if ($scope.searchFormStepchartLevels !== standardStepchartLevels) {
            $scope.searchFormStepchartLevels = standardStepchartLevels;
          }
      }
      $scope.$digest();
    });

    $('#update-modal').on('hidden.bs.modal', function (e) {
      $scope.targetRequest = null;
      resetForm();
      if (tinymce.get('requester_note')) {
        tinymce.get('requester_note').destroy();
      }
    })

    // error detect dom
    $(document).on('change', '#update-form-step-type', function () {
      var selectedType = $(this).val(),
        coopStepchartLevels = $scope.coopStepLevels,
        standardStepchartLevels = $scope.standardStepLevels;
      switch (selectedType) {
        case 'co-op':
          if ($scope.updateFormStepchartLevels !== coopStepchartLevels) {
            $scope.updateFormStepchartLevels = coopStepchartLevels;
          }
          break;
        case '': $scope.updateFormStepchartLevels = null; break;
        default:
          if ($scope.updateFormStepchartLevels !== standardStepchartLevels) {
            $scope.updateFormStepchartLevels = standardStepchartLevels;
          }
      }
      $scope.$digest();
    });


    $('select[id="search-form-item-per-pages"]').change(function () {
      var itemPerPage = $(this).val();
      if (!_.isEmpty($scope.trackingResult)) {
        var queryParams = $scope.trackingResult.query.params;

        const newQueryParams = {
          stepchart_type: queryParams.stepchart_type,
          stepchart_level: queryParams.stepchart_level,
          search: queryParams.search,
          item_per_page: itemPerPage
        }

        fetchRequestList(newQueryParams);
      }
    });

  })

  // Form init
  $(function () {
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

    var updateForm = {
      rules: {
        requester: 'required',
        stepchartLevel: 'required',
        stepchartType: 'required',
        stepmaker: 'required',
        ucsLink: {
          required: true,
          isUrlValid: true
        },
        updateToken: 'required'
      },
      errMsgs: {
        requester: "Please enter your name / nickname",
        stepchartLevel: "Please choose stepchart level",
        stepchartType: "Please choose stepchart type",
        stepmaker: "Please enter STEPMAKER name",
        ucsLink: {
          required: "Please enter UCS download link",
          isUrlValid: 'UCS download link is not valid'
        },
        updateToken: "Please enter your update token"
      }
    }

    var deleteForm = {
      rules: {
        confirmEmail: {
          required: true,
          isEmailValid: true,
          maxlength: 63
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

    var resendForm = {
      rules: {
        activationEmail: {
          required: true,
          isEmailValid: true,
          maxlength: 63
        },
        deleteToken: 'required'
      },
      errMsgs: {
        activationEmail: {
          required: "Please enter your email",
        }
      }
    }

    forms = {
      token: tokenForm,
      resend: resendForm,
      delete: deleteForm,
      update: updateForm
    }
  })

  function resetForm(targetForm = null) {
    if (_.isEmpty(targetForm)) {
      // Reset all forms
      const forms = $('#update-modal').find('form');
      Array.of(forms).forEach(function (form) {
        form.find('input:text, select, textarea').val('');
        form.find('input:text, select, textarea').each(function (index, inputElem) {
          $(inputElem).removeClass('is-invalid');
        })
        form.find('input:radio, input:checkbox').prop('checked', false);
        form.find('select').val('').trigger("change");
        form.find('label').each(function (index, labelItem) {
          $(labelItem).removeClass('label-invalid');
        })
      });

      if (tinymce.activeEditor) {
        tinymce.activeEditor.setContent('');
      }

      Object.keys(formObjs).forEach((key) => {
        if (formObjs[key].currentForm !== undefined) {
          formObjs[key].reset();
          formObjs[key].resetForm();
        }
      })
    } else {
      var formKey = targetForm.attr('mode') || 'token';
      targetForm.find('input:text, select, textarea').val('');
      if (tinymce.activeEditor) {
        tinymce.activeEditor.setContent('');
      }
      targetForm.find('select').val('');
      _.get(formObjs, formKey).resetForm()
    }
  }
})

ucsTrackingAppModule.config(function ($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
});

ucsTrackingAppModule.config(['$compileProvider', function ($compileProvider) {
  $compileProvider.debugInfoEnabled(false);
  $compileProvider.commentDirectivesEnabled(false);
  $compileProvider.cssClassDirectivesEnabled(false);
}]);

// angular.bootstrap(document, ['ucsTrackingApp'], {
//   strictDi: true
// });

function generateItemsOfPaginationLeft(currentPage) {
  let items = [];
  for (let i = currentPage - 3; i < currentPage; i++) {
    if (i > 0) {
      items.push(i);
    }
  }
  return items;
}

function generateItemsOfPaginationRight(currentPage, lastPage) {
  let items = [];
  for (let i = currentPage + 1; i <= lastPage; i++) {
    items.push(i);
    if (i >= currentPage + 3) {
      break;
    }
  }
  return items;
}

// Form
function initModalFormValidation() {
  $('#update-modal').find('form').each(function (index, targetFormElem) {
    var _targetFormElem = $(targetFormElem);
    console.log(_targetFormElem);
    var identifier = _targetFormElem.attr('mode') || 'token';
    var targetForm = _.get(forms, identifier);
    var formRules = _.get(targetForm, 'rules');
    var formErrMsg = _.get(targetForm, 'errMsgs');
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
  });
}