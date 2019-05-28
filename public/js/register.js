var requesterNoteInstance;

$(document).ready(function () {
  $('.b-select2').select2({
    escapeMarkup: function (markup) {
      return markup;
    },
    templateResult: function (data) {
      return data.text;
    },
    templateSelection: function (data) {
      return data.text;
    }
  });

  ClassicEditor
    .create(document.querySelector('#requester_note'), {
    }).then(function (editor) {
      requesterNoteInstance = editor;
    }).catch(function (error) {
      console.error(error);
    });
});

function getStepchartTypes() {
  return axios.get(apiUrl + '/stepchart-types');
}

function getSongs() {
  return axios.get(apiUrl + '/songs');
}

//  ----------------------------------- ANGULAR ------------------------------------------------------------------
var appModule = angular.module('registerUcsApp', ['angular.filter']);

appModule.controller('registerUcsCtrl', function ($scope, $http, $q) {
  $scope._csrf = $('input[name="_csrf"]').val();
  $scope.isFullyLoaded = false;

  $q.when(axios.all([getStepchartTypes(), getSongs()])).then(axios.spread(function (stepTypes, songs) {
    // Both requests are now complete
    $scope.stepchartTypes = stepTypes.data;
    $scope.songs = manipulateSongTitle(songs.data);
    $scope.isDataLoaded = true;
    $scope.isFullyLoaded = isFullyLoaded($scope);
  })).catch(function (error) {
    console.log(error.response || error);
  });


  $('select[name="stepchartType"]').change(function () {
    const selectedType = $(this).val();
    switch (selectedType) {
      case 'co-op':
        if ($scope.stepchartLevels !== coopStepchartLevels) {
          $scope.stepchartLevels = coopStepchartLevels;
        }
        break;
      case '': {
        $scope.stepchartLevels = null; break;
      }
      default:
        if ($scope.stepchartLevels !== standardStepchartLevels) {
          $scope.stepchartLevels = standardStepchartLevels;
        }
        break;
    }
    $scope.$digest();
    if (!_.isEmpty(formValidObj.submitted)) {
      $(this).valid();
      $('select[name="stepchartLevel"]').valid();
    }
  });

  $('.submit').click(function (e) {
    e.preventDefault();
    sanitizeFormInput();
    const form = $('#ucs-register-form');
    if (form.valid()) {
      // const { songs, requester, contentName, stepchartLevel, stepchartType, stepmaker, ucsLink, email } = $scope;
      const selectedSongVal = $('#song').val();
      // const song = getSelectedSong($scope.songs, selectedSongVal);
      // const requesterNote = requesterNoteInstance.getData();
      $scope.preview = {
        song: getSelectedSong($scope.songs, selectedSongVal), 
        requesterNote: requesterNoteInstance.getData(), 
        contentName: $scope.contentName, 
        requester: $scope.requester,
        stepchartLevel: $scope.stepchartLevel, 
        stepchartType: $scope.stepchartType,
        stepmaker: $scope.stepmaker, 
        ucsLink: $scope.ucsLink, 
        email: $scope.email
      }
      $scope.$apply();
      setTimeout(function () {
        $('#preview-modal').modal('show');
      })
    }
  });

  $('#confirm-submit').click(function () {
    const self = this;
    const processingState = '<i class="fas fa-circle-notch fa-spin"></i> Processing';
    const defaultState = 'Yes, submit this';
    $(self).empty().append(processingState);
    $(':button').prop('disabled', true);
    // const { song, contentName, email, requester, requesterNote, stepchartLevel, stepchartType, stepmaker, ucsLink } = $scope.preview;
    const previewData = $scope.preview;
    
    const data = {
      _csrf: $scope._csrf,
      song: previewData.song.value,
      contentName: previewData.contentName,
      email: previewData.email,
      requester: previewData.requester,
      requesterNote: previewData.requesterNote,
      stepchartLevel: previewData.stepchartLevel,
      stepchartType: previewData.stepchartType,
      stepmaker: previewData.stepmaker,
      ucsLink: previewData.ucsLink
    }

    axios.post('/register', data)
      .then(function (response) {
        setTimeout(function () {
          $(self).empty().append(defaultState);
          $('#preview-modal').modal('hide');
          $(':button').prop('disabled', false);
          Swal({
            title: 'Congratulations!',
            text: response.data.message,
            type: 'success',
            allowOutsideClick: false,
            confirmButtonText: 'OK'
          }).then(function () {
            resetForm();
            $scope.preview = null;
            $scope.$apply();
          })
        }, 2000);
      })
      .catch(function (error) {
        // const { response } = error;
        $(self).empty().append(defaultState);
        $('#preview-modal').modal('hide');
        $(':button').prop('disabled', false);
        Swal({
          title: 'Oof...',
          // html: `An error occured while registering, please try again later<br>
					// <strong>Error: </strong> ${response ? (response.data.message || response) : error.message}`,
          html: 'An error occured while registering, please try again later<br><strong>Error: </strong>' + _.isEmpty(error.response) ? (error.response.data.message || error.response) : error.message,
          type: 'error',
          allowOutsideClick: false,
          confirmButtonText: 'OK'
        })
      })
  });
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

const manipulateSongTitle = function(songs) {
  return _.map(songs, function(item) {
    return {
      songName: item.songName,
      artist: item.artist,
      group: item.group,
    //   title:
    //   `<div>
    //   <strong class="song-name">${songName}</strong>
    //   <br>
    //   <span class='artist'><span class='artist__label'>Artist:</span> ${artist}</span>
    // </div>`,
      title:
      '<div><strong class="song-name">' + item.songName + '</strong><br><span class="artist"><span class="artist__label">Artist:</span>' + item.artist + '</span></div>',
      value: item.value,
      thumbnailUrl: item.thumbnailUrl
    }
  })
}

function getSelectedSong(songs, selectedSong) {
  return _.find(songs, {'value': selectedSong});
}

function sanitizeFormInput() {
  $("#ucs-register-form").each(function () {
    var inputs = $(this).find(':input[type="text"]');
    Array.prototype.forEach.call(inputs, function(input) {
      const targetInput = $(input);
      const sanitizedValue = decodeHTMLEntities(sanitizeParam(targetInput.val()));
      targetInput.val(sanitizedValue);
      // //update angular ng-model
      $(input)[0].dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
}

function isFullyLoaded(scope) {
  return !_.isEmpty(requesterNoteInstance) && scope.isDataLoaded;
}

function sanitizeParam(dirty) {
  var sanitized = sanitizeHtml(dirty, {
    allowedTags: [],
    allowedAttributes: [],
  });

  return sanitized.trim();
}