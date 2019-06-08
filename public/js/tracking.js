var editors = {};

//  ----------------------------------- ANGULAR ------------------------------------------------------------------
var appModule = angular.module('trackingUcsApp', ['angular.filter']);

appModule.controller('trackingUcsCtrl', ($scope, $http, $q, $timeout) => {
	$scope._csrf = $('input[name="_csrf"]').val();

	$scope.isStepchartTypeLoaded = true;

	$q.when(axios.get(apiUrl + '/stepchart-types')).then(response => {
		$scope.stepchartTypes = response.data;
		$timeout(() => {
			$scope.isStepchartTypeLoaded = false;
		}, 1000);
	}).catch(error => {
		const { response } = error;
		console.error(response || error);
	});

	// First load
	fetchRequest();

	// Default load all stepchart levels
	$scope.stepchartLevels = _.concat(standardStepchartLevels, coopStepchartLevels);

	$scope.onSearch = function (event) {
		event.preventDefault();
		let params = $scope.searchForm;
		fetchRequest({
			params,
			beforeSend: () => {
				showLoadingModal();
			},
			alwaysCallback: () => {
				hideLoadingModal();
			}
		})
	}

	$scope.onResetClick = function ($event) {
		const currentMode = $event.target.getAttribute('mode').toLowerCase();
		var form = $('#' + currentMode + '-request-form');
		$timeout(() => {
			resetForm({
				form,
				currentMode
			})
		}, 1);
	}

	$scope.changePage = function (event) {
		const page = event.target.getAttribute('page');
		const params = $scope.trackingResult.query.params;

		const { stepchart_type, stepchart_level, search } = params;
		const queryParams = {
			stepchart_type,
			stepchart_level,
			search,
			page
		}

		fetchRequest({
			params: queryParams,
			beforeSend: () => {
				showLoadingModal();
			},
			alwaysCallback: () => {
				hideLoadingModal();
			}
		});
	}

	function showLoadingModal() {
		Swal({
			title: 'Please wait',
			onBeforeOpen: () => {
				Swal.showLoading();
			},
			showConfirmButton: false,
			allowOutsideClick: false
		});
	}

	function hideLoadingModal(isFocusToList = true) {
		setTimeout(() => {
			Swal.hideLoading();
			Swal.close();
			if (isFocusToList) {
				window.scrollTo(0, $('#search-panel').offset().top);
			}
		}, 2000);
	}

	$scope.$on('reloadList', function () {
		let queryParams = {};
		
		if ($scope.trackingResult) {
			const { query, currentPage } = $scope.trackingResult;
			const { stepchart_type, stepchart_level, search } = query.params;
			queryParams = {
				stepchart_type,
				stepchart_level,
				search,
				currentPage
			}	
		}

		fetchRequest({
			params: queryParams,
			beforeSend: () => {
				showLoadingModal();
			},
			alwaysCallback: () => {
				hideLoadingModal(false);
			}
		});
	});

	function fetchRequest({ params = null, beforeSend = null,
		successCallback = null, errorCallback = null, alwaysCallback = null } = {}) {
		let axiosRequest;
		switch (typeof params) {
			case 'object':
				axiosRequest = $q.when(axios.get(apiUrl + '/requests', {
					params,
					timeout: 20000,
				})); break;
			default: axiosRequest = $q.when(axios.get(`${apiUrl}/requests${params}`, {
				timeout: 20000,
			})); break;
		}

		if (beforeSend && typeof beforeSend === 'function') {
			beforeSend();
		}

		$scope.isFetchingRequest = true;
		$scope.isResultNotFoundShow = false;
		$scope.isSearchResultShow = false;
		$scope.error = null;
		$scope.isFetchingRequestTimeout = false;		
		$scope.isPristineList = null;

		axiosRequest.then(response => {
			$scope.trackingResult = response.data;
			const { currentPage, totalPages, query, totalItems, message } = $scope.trackingResult;

			if (message) {
				$scope.isListEmpty = true;
			} else {
				$scope.isListEmpty = false;
				const stepchartTypes = $scope.stepchartTypes;
				const selectedStepchartType = query ? query.params.stepchart_type : null;
				const isQueryEmpty = _.isEmpty(query.params.stepchart_level) && _.isEmpty(query.params.stepchart_type) && _.isEmpty(query.params.search);
				const isEmpty = _.isEmpty(totalItems) && totalItems <= 0;
				$scope.isSearchResultShow = !isQueryEmpty && !isEmpty;
				if (selectedStepchartType) {
					const selectedStepchartTypeLabel = _.find(stepchartTypes, { 'value': selectedStepchartType }).title;
					$scope.trackingResult.query.params.stepchart_type_label = selectedStepchartTypeLabel
				}
			}

			$scope.leftPaginationItems = generateItemsOfPaginationLeft(currentPage);
			$scope.rightPaginationItems = generateItemsOfPaginationRight(currentPage, totalPages);
			if (successCallback && typeof successCallback === 'function') {
				successCallback();
			}
		}).catch(error => {
			const { response } = error;
			// console.log(response || error.message);
			// const appError = {
			// 	message: response.data.message || error.message
			// }
			// $scope.error = appError;
			if (!_.isEmpty(response) && response.data.status === 404) {
				$scope.isPristineList = response.data.isPristine;
				$scope.isResultNotFoundShow = !$scope.isPristineList;
			} else {
				if (error.code === 'ECONNABORTED') {
					console.log('Timeout');
					$scope.isFetchingRequestTimeout = true;		
				} else {
					const appError = {
						message: response || error.message
					}
					$scope.error = appError;	
				}
			}

			if (errorCallback && typeof errorCallback === 'function') {
				errorCallback();
			}
		}).then(() => {
			// always Callback
			$scope.isFetchingRequest = false;
			if (alwaysCallback && typeof alwaysCallback === 'function') {
				alwaysCallback();
			}
		});
	}

	$('select[name="stepchartType"]').change(function () {
		const selectedType = $(this).val();
		switch (selectedType) {
			case 'co-op':
				if ($scope.stepchartLevels !== coopStepchartLevels) {
					$scope.stepchartLevels = coopStepchartLevels;
				}
				break;
			case '': {
				$scope.stepchartLevels = _.concat(standardStepchartLevels, coopStepchartLevels);
				break;
			}
			default:
				if ($scope.stepchartLevels !== standardStepchartLevels) {
					$scope.stepchartLevels = standardStepchartLevels;
				}
		}
		$scope.$digest();
	});

	$scope.reloadListTimeout = function(event) {
		event.preventDefault();
		$scope.$emit('reloadList');
	}

});

appModule.directive('ckeditor', function () {
	return {
		require: '?ngModel',
		link: function (scope, element, attrs, ngModel) {
			if (!ngModel) return;
			ClassicEditor
				.create(element[0], {
				}).then(editor => {
					editor.model.document.on('change:data', () => {
						scope.$apply(() => {
							ngModel.$setViewValue(editor.getData());
						});
					});
					const editorKey = element[0].name;
					editors[editorKey] = editor;
					ngModel.$render = function (value) {
						editor.setData(ngModel.$modelValue);
					};
				}).catch(error => {
					console.error(error);
				});
		}
	};
});

appModule.config(function ($interpolateProvider) {
	$interpolateProvider.startSymbol('{[{');
	$interpolateProvider.endSymbol('}]}');
});

appModule.config(['$compileProvider', function ($compileProvider) {
	$compileProvider.debugInfoEnabled(false);
	$compileProvider.commentDirectivesEnabled(false);
	$compileProvider.cssClassDirectivesEnabled(false);
}]);

//  ----------------------------------- END ANGULAR ------------------------------------------------------------------

function sanitizeParams(formValueObj) {
	Object.keys(formValueObj).forEach(function (key, index) {
		// key: the name of the object key
		// index: the ordinal position of the key within the object
		const targetValue = formValueObj[key];
		const sanitizedValue = sanitizeParam(targetValue);
		formValueObj[key] = sanitizedValue;
	});
	return formValueObj;
}

function sanitizeParam(dirty) {
	if (dirty) {
		var sanitized = sanitizeHtml(dirty, {
			allowedTags: [],
			allowedAttributes: [],
		});

		return decodeHTMLEntities(sanitized).trim();
	}
	return;
}

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
