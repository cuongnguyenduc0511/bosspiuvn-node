var carousel;

function initCarousel() {
    carousel = $('.owl-carousel').owlCarousel({
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

var appModule = angular.module('songApp', []);

appModule.controller('songCtrl', ($scope, $http, $q, $timeout) => {
    $scope.isCarouselInit = null;
    $('.owl-carousel').on('initialized.owl.carousel', function (event) {
        $scope.songList = getSongList(event);
        $scope.isCarouselInit = true;
    });

    $q.when(axios.get(apiUrl + '/songs')).then(response => {
        $scope.songs = response.data;
    }).catch(error => {
        const { response } = error;
        console.log(response || error);
    }).then(() => {
        initializeCarousel();
    });

    function initializeCarousel() {
        $q.when(axios.get(baseUrl + '/series')).then(response => {
            const { series } = response.data;
            const sorted = _.sortBy([...series], ['order']);
            $scope.series = sorted;
            $timeout(() => {
                initCarousel();
                carousel.on('changed.owl.carousel', function (event) {
                    $scope.songList = getSongList(event);
                    $scope.$digest();
                });
            })
        }).catch(error => {
            const { response } = error;
            console.log(response || error);
        });
    }

    function getSongList(event) {
        let currentSeriesIndex = getCurrentIndex(event);
        const series = $scope.series;
        const songs = $scope.songs;
        const currentSeries = series[currentSeriesIndex];
        let songList = _.filter(songs, function (item) { return item.group === currentSeries.title; });
        songList = _.sortBy(songList, ['songName']);
        return songList;
    }

    $scope.triggerNextCarousel = function() {
        moveCarousel('next');
    }

    $scope.triggerPrevCarousel = function() {
        moveCarousel('prev');
    }

    function moveCarousel(direction) {
        const moveEvents = `${direction}.owl.carousel`;
        $timeout(() => {
            carousel.trigger(moveEvents);
        }, 1);
    }

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


function getCurrentIndex(event) {
    var pos = event.relatedTarget.normalize(event.item.index, true) - Math.ceil(event.item.count / 2);;
    if (pos < 0) {
        var imgCount = event.item.count;
        pos = imgCount + pos;
    }
    // console.log("index in original image list is ", pos);
    return pos;
}
