var songCarousel;

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

songPageAppModule.controller('songCtrl', ($scope, $http, $q, $timeout) => {
  $scope.isCarouselInit = false;
  $('.owl-carousel').on('initialized.owl.carousel', function (event) {
    setTimeout(function () {
      var currentSeries = $('.owl-item.active.center').find('.series-img').attr('series');
      var currentSeriesObj = _.find($scope.series, { 'categoryId': currentSeries });
      $scope.isCarouselInit = true;
      $scope.songList = currentSeriesObj.items;
      $scope.$digest();
    })
  });

  $q.when(getSongs()).then(response => {
    $scope.series = response.data;
  }).catch(error => {
    const { response } = error;
    console.log(response || error);
  }).then(() => {
    initializeCarousel();
  });

  $('.owl-carousel').on('changed.owl.carousel', function (event) {
    if ($scope.isCarouselInit) {
      abortLoadingImages().then(function() {
        var currentSeries = $('.owl-item.active.center').find('.series-img').attr('series');
        var currentSeriesObj = _.find($scope.series, { 'categoryId': currentSeries });
        $scope.songList = currentSeriesObj.items;  
        $scope.$digest();
      })
    }
  });

  function initializeCarousel() {
    setTimeout(function () {
      initCarousel();
    })
  }

  function abortLoadingImages() {
    const loadingThumbs = $('img.song-thumbnail');
    console.log(loadingThumbs);
    return Promise.resolve(loadingThumbs.each(function() {
      $(this).attr("src", "");
    }))
  }

  $scope.moveCarousel = function(direction) {
    // prev or next
    moveCarousel(direction);
  }

  function moveCarousel(direction) {
    const moveEvents = `${direction}.owl.carousel`;
    $timeout(() => {
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
