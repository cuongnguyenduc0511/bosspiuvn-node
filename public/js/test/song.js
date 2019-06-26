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
  $scope.isCarouselInit = null;
  $('.owl-carousel').on('initialized.owl.carousel', function (event) {
    console.log('carousel init');
  });

  $q.when(getSongs()).then(response => {
    $scope.series = response.data;
    console.log(response.data);
  }).catch(error => {
    const { response } = error;
    console.log(response || error);
  }).then(() => {
    initializeCarousel();
  });

  function initializeCarousel() {
    setTimeout(function() {
      initCarousel();
    }, 5000)
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
