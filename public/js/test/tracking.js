var baseUrl = window.location.protocol + '//' + window.location.host;
var apiUrl = baseUrl + '/api'

function getCommonData() {
  return axios.get(apiUrl + '/commons');
}

var ucsTrackingAppModule = angular.module('ucsTrackingApp', []);

ucsTrackingAppModule.controller('ucsTrackingAppCtrl', function ($scope, $http, $q) {
  var fetchData = function () {
    return Promise.resolve(
      $q.when(axios.all([getCommonData()])).then(axios.spread(function (commonData) {
        // Both requests are now complete
        const commonDataResult = commonData.data;
        // const songDataResult = songData.data;
        return {
          common: commonDataResult,
          //   songs: songDataResult
        }
      })).catch(function (error) {
        console.log(error.response || error);
        return Promise.reject(error);
      })
    );
  }

  Promise.all([fetchData()]).then(function (data) {
    var commonData = data[0].common;
    $scope.standardStepLevels = commonData.stepchartLevels.standard;
    $scope.coopStepLevels = commonData.stepchartLevels.coop;
    $scope.stepchartTypes = commonData.stepchartTypes;
    $scope.stepchartLevels = _.concat($scope.standardStepLevels, $scope.coopStepLevels);
    // $scope.isFullyLoaded = true;
    setTimeout(function() {
      $('.sec-request-list').show();
    }, 2000)
    $scope.$digest();
  }).catch(function (error) {
    console.log(error.response || error);
  })

  $('select[id="search-form-step-type"]').change(function () {
    var selectedType = $(this).val(),
        coopStepchartLevels = $scope.coopStepLevels,
        standardStepchartLevels = $scope.standardStepLevels;

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

  $('#search').click(function () {
    console.log('button clicked');
  })
})