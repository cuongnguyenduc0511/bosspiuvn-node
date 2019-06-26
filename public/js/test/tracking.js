var baseUrl = window.location.protocol + '//' + window.location.host;
var apiUrl = baseUrl + '/api'
var REQUEST_TIME_OUT = 10000;

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

ucsTrackingAppModule.controller('ucsTrackingAppCtrl', function ($scope, $http, $q) {
  $scope.isFullyLoaded = false;
  $scope.searchForm = {};

  var fetchData = function () {
    return Promise.resolve(
      $q.when(axios.all([getCommonData(), getRequestList()])).then(axios.spread(function (commonData, requestData) {
        // Both requests are now complete
        var commonDataResult = commonData.data;
        var requestPaginationResult = requestData.data;
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
      })
    );
  }

  function firstLoad() {
    Promise.all([fetchData()]).then(function (data) {
      var commonData = data[0].common;
      var trackingResult = data[0].requestPagination;
      $scope.trackingResult = trackingResult.paginationResult;
      $scope.standardStepLevels = commonData.stepchartLevels.standard;
      $scope.coopStepLevels = commonData.stepchartLevels.coop;
      $scope.searchFormStepchartTypes = commonData.stepchartTypes;
      $scope.searchFormStepchartLevels = _.concat($scope.standardStepLevels, $scope.coopStepLevels);
  
      var currentPage = $scope.trackingResult.currentPage;
      var totalPages = $scope.trackingResult.totalPages;
      $scope.leftPaginationItems = generateItemsOfPaginationLeft(currentPage);
      $scope.rightPaginationItems = generateItemsOfPaginationRight(currentPage, totalPages);
  
      $scope.isFullyLoaded = true;
      $scope.$digest();
      setTimeout(function() {
        $('.sec-request-list').show();
      }, 2000)
    }).catch(function (error) {
      console.log(error.response || error);
    });
  }

  firstLoad();

  $scope.onSearch = function (event) {
    event.preventDefault();
    var params = $scope.searchForm;
    fetchRequestList(params);
  }

  $scope.onReload = function (event) {
    if (!$scope.isFullyLoaded) {
      firstLoad();
    } else {
      // 
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

    $q.when(getRequestList(params)).then(function(requestData) {
      var trackingResult = requestData.data;
      switch(trackingResult.code) {
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
    }).finally(function() {
      Swal.hideLoading();
			Swal.close();
      window.scrollTo(0, $('#search-form').offset().top);
    })
  }

  $(function () {
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
    
    $('select[id="search-form-item-per-pages"]').change(function () {
      var itemPerPage = $(this).val();
      if(!_.isEmpty($scope.trackingResult)) {
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
