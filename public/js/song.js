var songCarousel;

var baseUrl = window.location.protocol + '//' + window.location.host;
var apiUrl = baseUrl + '/api'

function initCarousel() {
  songCarousel = $('.song-carousel').owlCarousel({
    loop: true,
    center: true,
    margin: 10,
    dots: false,
    nav: false,
    items: 1,
    responsive: {
      0: {
        items: 1
      },
      600: {
        items: 3
      },
      1000: {
        items: 3
      }
    }
  });
}

function getSongs() {
  return axios.get(apiUrl + '/songs/test');
}

var songPageAppModule = angular.module('songApp', []);

songPageAppModule.controller('songCtrl', function($scope, $http, $q, $timeout) {
  $scope.isCarouselInit = false;
  $('.owl-carousel').on('initialized.owl.carousel', function (event) {
    setTimeout(function () {
      var currentSeries = $('.owl-item.active.center').find('.series-img').attr('series');
      var currentSeriesObj = _.find($scope.series, { 'categoryId': currentSeries });
      $scope.isCarouselInit = true;
      $scope.songList = currentSeriesObj.items;
      $scope.beforeTargetSeries = currentSeriesObj.categoryId;
      $scope.$digest();
    })
  });

  $q.when(getSongs()).then(function(response) {
    $scope.series = response.data;
  }).catch(function(error) {
    console.log(error.response || error);
  }).then(function() {
    initializeCarousel();
  });

  $('.owl-carousel').on('changed.owl.carousel', function (event) {
    if ($scope.isCarouselInit) {
      setTimeout(function() {
        var currentSeries = $('.owl-item.active.center').find('.series-img').attr('series');
        if(currentSeries !== $scope.beforeTargetSeries) {
          abortLoadingImages().then(function() {
            var currentSeriesObj = _.find($scope.series, { 'categoryId': currentSeries });
            $scope.songList = currentSeriesObj.items; 
            $scope.beforeTargetSeries = currentSeriesObj.categoryId;
            $scope.$digest();
            $('.sec-song-list-wrapper').hide();
            setTimeout(function() {
              $('.sec-song-list-wrapper').show();
            }, 1000);
          })
        }
      })
    }
  });

  function initializeCarousel() {
    setTimeout(function () {
      initCarousel();
    })
  }

  function abortLoadingImages() {
    var loadingThumbs = $('img.song-thumbnail');
    return Promise.resolve(loadingThumbs.each(function() {
      $(this).attr("src", "");
    }))
  }

  $scope.moveCarousel = function(direction) {
    // prev or next
    moveCarousel(direction);
  }

  function moveCarousel(direction) {
    var moveEvents = direction + '.owl.carousel';
    $timeout(function()  {
      songCarousel.trigger(moveEvents);
    }, 1);
  }

});

songPageAppModule.config(function ($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
});

songPageAppModule.config(['$compileProvider', function ($compileProvider) {
  $compileProvider.debugInfoEnabled(false);
  $compileProvider.commentDirectivesEnabled(false);
  $compileProvider.cssClassDirectivesEnabled(false);
}]);


function getCurrentIndex(event) {
  var pos = event.relatedTarget.normalize(event.item.index, true) - Math.ceil(event.item.count / 2);;
  if (pos < 0) {
    var imgCount = event.item.count;
    pos = imgCount + pos;
  }
  // console.log("index in original image list is ", pos);
  return pos;
}
