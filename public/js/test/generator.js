var baseUrl = window.location.protocol + '//' + window.location.host;
var apiUrl = baseUrl + '/api'

var descGenAppModule = angular.module('descGenApp', []);

var header = "";
var footer = "";

function getCommonData() {
  return axios.get(apiUrl + '/commons');
}

function getSongs() {
  return axios.get(apiUrl + '/songs/test');
}

descGenAppModule.controller('descGenAppCtrl', function ($scope, $http, $q) {
  $scope.p1Disabled = true;
  $scope.p2Disabled = true;

  $q.when(axios.all([getCommonData(), getSongs()])).then(axios.spread(function (commonData, songData) {
    // Both requests are now completed
    var commonData = commonData.data;
    // var songDataResult = songData.data;
    $scope.standardStepLevels = commonData.stepchartLevels.standard;
    $scope.standardStepLevels2 = commonData.stepchartLevels.standard;
    $scope.coopStepLevels = commonData.stepchartLevels.coop;
    $scope.stepchartTypes = commonData.stepchartTypes;
  })).catch(function (error) {
    console.log(error.response || error);
  })

  $('select[name="stepchartType"]').change(function () {
    var selectedType = $(this).val();
    var coopStepchartLevels = $scope.coopStepLevels;
    var standardStepchartLevels = $scope.standardStepLevels;
    switch (selectedType) {
      case 'co-op':
        if ($scope.stepchartLevels !== coopStepchartLevels) {
          $scope.stepchartLevels = coopStepchartLevels;
        }
        $scope.p1Disabled = true;
        $scope.p2Disabled = true;
        break;
      case 'single': {
        if ($scope.stepchartLevels !== standardStepchartLevels) {
          $scope.stepchartLevels = standardStepchartLevels;
        }
        if ($scope.stepchartLevels2 !== standardStepchartLevels) {
          $scope.stepchartLevels2 = standardStepchartLevels;
        }
        $scope.p1Disabled = false;
        $scope.p2Disabled = false;
        break;
      }
      case 'single-performance': {
        $scope.p1Disabled = false;
        $scope.p2Disabled = false;
        break;
      }
      case '': {
        $scope.p1Disabled = true;
        $scope.p2Disabled = true;
      }
      default:
        if ($scope.stepchartLevels !== standardStepchartLevels) {
          $scope.stepchartLevels = standardStepchartLevels;
        }
        $scope.p2Disabled = true;
        $scope.form.stepchartLevel2 = '';
        $scope.form.player2 = '';
        break;
    }
    $scope.$digest();
  });

  $('select[name="stepchartLevel"]').change(function () {
    var selectedType = $('select[name="stepchartType"]').val();
    switch (selectedType) {
      case 'co-op':
        var coopValue = $(this).val();
        $scope.coopFullName = coopAlias[coopValue] || '';
        console.log($scope.coopFullName);
        break;
      default:
        $scope.coopFullName = '';
        break;
    }
    $scope.$digest();
  });

  $('#generate').click(function() {
    var title = generateTitle();
    console.log('title');
    console.log(title);
    var seoTags = generateSEOTags();
    console.log(seoTags);
  });  

  function generateTitle() {
    var form = $scope.form;
    var selectedStepType = _.find($scope.stepchartTypes, {'value': form.stepchartType});
    var diffLabel = selectedStepType.shortLabel;
    var title = form.songName + (form.songNameAlias ? ' (' + form.songNameAlias + ')' : '');
    var difficulty = diffLabel + form.stepchartLevel + (form.stepchartLevel2 ? (' & ' + diffLabel + form.stepchartLevel2) : '')
    var version = '| PUMP IT UP XX (20th Anniversary Edition) Patch ' + form.version + ' ✔';
    var fullTitle = title + ' ' + difficulty + ' ' + version;
    return fullTitle;
  }

  function generateDescription() {
    var selectedStepType = _.find($scope.stepchartTypes, {'value': form.stepchartType});
    var diffLabel = selectedStepType.shortLabel;
    return fullTitle;
  }

  function generateSEOTags() {
    var form = $scope.form;
    var songName = $scope.form.songName.toLowerCase();
    var songNameAlias = $scope.form.songNameAlias;
    var artist = $scope.form.artist.toLowerCase();
    var artistAlias = $scope.form.artistAlias;
    var selectedStepType = _.find($scope.stepchartTypes, {'value': form.stepchartType});
    var diffLabel = selectedStepType.longLabel.toLowerCase();
    var tag1 = songName + (!_.isEmpty(songNameAlias) ? (', ' + songNameAlias) : '');
    var tag2 = songName + ' ' + diffLabel + (!_.isEmpty(songNameAlias) ? (' ,' + songNameAlias + ' ' + diffLabel) : '');
    var tag3 = `${artist} ${!_.isEmpty(artistAlias) ? (',' + artistAlias + ',') : ','} pump it up xx, 펌프 잇 업 XX, patch ${form.version}, boss_piuvn, bosspiuvn`;
    // var tags = `${songName}, ${songNameAlias}, ${songName + ` ${diffLabel}`}, ${songNameAlias + ` ${diffLabel}`}`
    return tag1 + ', ' + tag2 + ', ' + tag3;
  }

});

descGenAppModule.config(function ($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
});

descGenAppModule.config(['$compileProvider', function ($compileProvider) {
  $compileProvider.debugInfoEnabled(false);
  $compileProvider.commentDirectivesEnabled(false);
  $compileProvider.cssClassDirectivesEnabled(false);
}]);

var coopAlias = {
  'X2': 'Double Performance',
  'X3': 'Triple Performance',
  'X4': 'Quadruple Performance',
  'X5': 'Quintuple Performance',
  'X6': 'Sextuple Performance',
  'X7': 'Septuple Performance',
  'X8': 'Octuple Performance',
  'X9': 'Nonuple Performance',
}

var dualPlayDescription = `<p>PUMP IT UP XX: 20th Anniversary Edition 1.01.0 (International Version)</p>
<p>■ Song: Ice Of Death</p>
<p>■ Artist: Fiverwater</p>
<p>■ Step Artist: CONRAD</p>
<p>■ Difficulty :</p>
<p>Left: S17 (Single 17)</p>
<p>Right: S20 (Single 20)</p>
<p>■ Player: BADDLESN (P1 Side), NUMBUH_1 (P2 Side)</p>
<p>&nbsp;</p>
<p>[VIETNAM]</p>
<p>&nbsp;</p>
<p>► Follow our facebook page:</p>
<p>https://www.facebook.com/bosspiuvnpumpitupteamofficial/</p>
<p>&nbsp;</p>
<p>► Follow our Twitter:&nbsp;</p>
<p>https://twitter.com/BOSS_PIUVN</p>
<p>&nbsp;</p>
<p>► Follow Smurf's Town Gamezone (LANG XI TRUM) Facebook page:</p>
<p>https://www.facebook.com/LangXiTrumNowzone/</p>
<p>&nbsp;</p>
<p>► More PIU artworks here, Please visit and like page:</p>
<p>Gyo Design+</p>
<p>https://www.facebook.com/GyoDesigns/</p>
<p>&nbsp;</p>
<p>Step-art Line:</p>
<p>https://www.facebook.com/stepartline/</p>
<p>https://stepart-line.deviantart.com/</p>
<p>&nbsp;</p>
<p>#IceOfDeath #Fiverwater #PumpItUpXX</p>
<p>&nbsp;</p>
<p>*** BOSS_PIUVN Team ***</p>`