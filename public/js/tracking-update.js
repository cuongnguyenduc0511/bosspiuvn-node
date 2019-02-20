const UPDATE_MODE = 'Update';
const DELETE_MODE = 'Delete';
const PRIMARY_CLASS = 'primary';
const DANGER_CLASS = 'danger';
const SUCCESS_CLASS = 'success';

appModule.controller('trackingUcsSubCtrl', ($scope, $http, $q, $timeout) => {

	initModalFormValidation();

	$scope.showUpdateModal = (targetRequestId, mode) => {
		$scope.updateMode = mode;
		$scope.targetRequest = targetRequestId;
		// const updateForm = $(`#update-request-form`);
		// const deleteForm = $(`#delete-request-form`);
		switch (mode) {
			case UPDATE_MODE:
				$scope.submitButtonStyle = PRIMARY_CLASS;
				// updateForm.show();
				// deleteForm.hide();
				break;
			case DELETE_MODE:
				$scope.submitButtonStyle = DANGER_CLASS;
				// deleteForm.show();
				// updateForm.hide();
				break;
		}
		$('#update-request-modal').modal('show');
	}

	$scope.submitRequestToken = ($event) => {
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
						resetForm({
							formId: 'request-token-form'
						});
					});
				}, 2000);
			}).catch(error => {
				const { response } = error;
				$scope.isRequestingToken = false;
				Swal({
					title: 'Oof...',
					text: response ? (response.data.message || response) : error,
					type: 'error',
					allowOutsideClick: false
				});
			});
		};
	}

	$scope.submitUpdate = ($event) => {
		const currentMode = $event.target.getAttribute('mode');
		console.log(`#${currentMode.toLowerCase()}-request-form`);
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
			}

			const { targetRequest, _csrf } = $scope;
			formData = Object.assign({
				requestId: targetRequest,
				_csrf
			}, formData);

			$q.when(axios.post(requestUrl, formData)).then(response => {
				$timeout(() => {
					$('#update-request-modal').modal('hide');
					toggleTextArea(false, form);
					Swal({
						title: 'Success',
						text: response.data.message,
						type: 'success',
						allowOutsideClick: false
					}).then(() => {
						$scope.$emit('reloadList');
					});
				}, 2000);
			}).catch(error => {
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

			// $q.when(axios.post(requestUrl, {
			// 	...formData,
			// 	requestId: $scope.targetRequest
			// })).then(response => {
			// 	$timeout(() => {
			// 		$('#update-request-modal').modal('hide');
			// 		toggleTextArea(false, form);
			// 		Swal({
			// 			title: 'Success',
			// 			text: response.data.message,
			// 			type: 'success',
			// 			allowOutsideClick: false
			// 		}).then(() => {
			// 			$scope.$emit('reloadList');
			// 		});
			// 	}, 2000);
			// }).catch(error => {
			// 	$scope.isRequestingSubmit = false;
			// 	const { response } = error;
			// 	toggleTextArea(false, form);
			// 	Swal({
			// 		title: 'Oof...',
			// 		text: response ? (response.data.message || response) : error,
			// 		type: 'error',
			// 		allowOutsideClick: false
			// 	}).then(() => {
			// 		resetForm({
			// 			formId: form.attr('id'),
			// 			currentMode
			// 		})
			// 	});
			// });
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
		if (!_.isEmpty(updateFormValidObj.submitted)) {
			$(this).valid();
			$('select[name="updateStepchartLevel"]').valid();
		}
	});
});