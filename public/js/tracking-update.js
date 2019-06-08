const UPDATE_MODE = 'Update';
const DELETE_MODE = 'Delete';
const RESEND_ACTIVATION = 'Resend';
const PRIMARY_CLASS = 'primary';
const DANGER_CLASS = 'danger';
const INFO_CLASS = 'info';

appModule.controller('trackingUcsSubCtrl', ($scope, $http, $q, $timeout) => {

  initModalFormValidation();

  $scope.showUpdateModal = function(targetRequestId, mode) {
    $scope.updateMode = mode;
    $scope.targetRequest = targetRequestId;
    switch (mode) {
      case UPDATE_MODE:
        $scope.submitButtonStyle = PRIMARY_CLASS;
        $scope.submitButtonLabel = UPDATE_MODE;
        break;
      case DELETE_MODE:
        $scope.submitButtonStyle = DANGER_CLASS;
        $scope.submitButtonLabel = DELETE_MODE;
        break;
      case RESEND_ACTIVATION:
        $scope.submitButtonStyle = INFO_CLASS;
        $scope.submitButtonLabel = RESEND_ACTIVATION;
        break;
    }
    $('#update-request-modal').modal('show');
  }

  $scope.submitRequestToken = function($event) {
    const form = $(`#request-token-form`);
    const updateMode = $event.target.getAttribute('mode');
    const { _csrf, targetRequest } = $scope;
    if (form.valid()) {
      const data = {
        _csrf,
        mode: updateMode,
        requestId: targetRequest,
        email: $scope.email
      }
      $scope.isRequestingToken = true;
      const updateForm = $(`#${updateMode.toLowerCase()}-request-form`);
      toggleTextArea(true, updateForm);
      $q.when(axios.post(baseUrl + '/request-token', data)).then(response => {
        $timeout(() => {
          $scope.isRequestingToken = false;
          Swal({
            title: 'Success',
            text: response.data.message,
            type: 'success',
            allowOutsideClick: false
          }).then(() => {
            toggleTextArea(false, updateForm);
            resetForm({
              form: $('request-token-form')
            });
          });
        }, 2000);
      }).catch(error => {
        const { response } = error;
        $scope.isRequestingToken = false;
        toggleTextArea(false, updateForm);
        Swal({
          title: 'Oof...',
          text: response ? (response.data.message || response) : error,
          type: 'error',
          allowOutsideClick: false
        });
      });
    };
  }

  $scope.submitUpdate = function($event) {
    const currentMode = $event.target.getAttribute('mode');
    const form = $(`#${currentMode.toLowerCase()}-request-form`);
    if (form.valid()) {
      $scope.isRequestingSubmit = true;
      toggleTextArea(true, form);
      let formData = $scope[`${currentMode.toLowerCase()}Form`];
      let requestUrl;
      switch (currentMode) {
        case UPDATE_MODE:
          requestUrl = baseUrl + '/update-request';
          break;
        case DELETE_MODE:
          requestUrl = baseUrl + '/delete-request';
          break;
        case RESEND_ACTIVATION:
          requestUrl = baseUrl + '/resend-activation';
          break;
      }

      const { targetRequest, _csrf } = $scope;
      formData = Object.assign({
        requestId: targetRequest,
        _csrf
      }, formData);

      $q.when(axios.post(requestUrl, formData)).then(function(response) {
        $timeout(function() {
          $('#update-request-modal').modal('hide');
          toggleTextArea(false, form);
          Swal({
            title: 'Success',
            text: response.data.message,
            type: 'success',
            allowOutsideClick: false
          }).then(() => {
            if (currentMode !== RESEND_ACTIVATION) {
              $scope.$emit('reloadList');
            } else {
              const targetResend = $('#resend-' + targetRequest);
              targetResend.attr('style', 'display: none !important');
            }
          });
        }, 2000);
      }).catch(function(error) {
        $scope.isRequestingSubmit = false;
        const { response } = error;
        toggleTextArea(false, form);
        Swal({
          title: 'Oof...',
          text: response ? (response.data.message || response) : error,
          type: 'error',
          allowOutsideClick: false
        })
      });
    }
  }

  $('#update-request-modal').on('hide.bs.modal', function (e) {
    $scope.updateAlert = null;
    $scope.targetRequest = null;
    resetForm();
  });

  $('#update-request-modal').on('show.bs.modal', function (e) {
    $scope.isRequestingToken = false;
    $scope.isRequestingSubmit = false;
  });

  $('select[name="updateStepchartType"]').change(function () {
    const selectedType = $(this).val();
    switch (selectedType) {
      case 'co-op':
        if ($scope.updateStepchartLevels !== coopStepchartLevels) {
          $scope.updateStepchartLevels = coopStepchartLevels;
        }
        break;
      case '': {
        $scope.updateStepchartLevels = null;
        break;
      }
      default:
        if ($scope.updateStepchartLevels !== standardStepchartLevels) {
          $scope.updateStepchartLevels = standardStepchartLevels;
        }
    }
    $scope.$digest();
    if (!_.isEmpty(formObjs['update'].submitted)) {
      $(this).valid();
      $('select[name="updateStepchartLevel"]').valid();
    }
  });
});