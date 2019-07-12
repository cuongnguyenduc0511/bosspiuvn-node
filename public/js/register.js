var baseUrl = window.location.protocol + '//' + window.location.host;
var apiUrl = baseUrl + '/api'

function getCommonData() {
  return axios.get(apiUrl + '/commons');
}

function getSongs() {
  return axios.get(apiUrl + '/songs/test');
}
//  ----------------------------------- ANGULAR ------------------------------------------------------------------
var registerAppModule = angular.module('registerUcsApp', []);

registerAppModule.controller('registerUcsCtrl', function ($scope, $http, $q) {
  $scope._csrf = $('input[name="_csrf"]').val();
  $scope.isFullyLoaded = false;

  var fetchData = function () {
    return Promise.resolve(
      $q.when(axios.all([getCommonData(), getSongs()])).then(axios.spread(function (commonData, songData) {
        // Both requests are now complete
        var commonDataResult = commonData.data;
        var songDataResult = songData.data;
        return {
          common: commonDataResult,
          songs: songDataResult
        }
      })).catch(function (error) {
        console.log(error.response || error);
        return Promise.reject(error);
      })
    );
  }

  Promise.all([fetchData(), initTextArea()]).then(function (data) {
    var commonData = data[0].common;
    let songData = data[0].songs;
    $scope.standardStepLevels = commonData.stepchartLevels.standard;
    $scope.coopStepLevels = commonData.stepchartLevels.coop;
    $scope.stepchartTypes = commonData.stepchartTypes;
    $scope.songs = manipulateSongData(songData);
    $scope.isFullyLoaded = true;
    $scope.$digest();
  }).catch(function (error) {
    console.log(error.response || error);
  })

  var previewThumbnailInstance
  $(function () {
    // $('.preview-value').each(function(index, elem) {
    //   console.log($(elem))
    //   // $clamp($(elem), {clamp: 1, useNativeClamp: false});
    //   var ellipsis = new Ellipsis($(elem));
    //   ellipsis.calc();
    //   ellipsis.set();
    // })
    initSongSelectField();
    $('#register-form').find('.form-control').each(function (index, elem) {
      $(elem).focus(function () {
        $(elem).addClass('active');
        $(elem).parent().prev().addClass('active');
      })

      $(elem).blur(function () {
        $(elem).removeClass('active');
        $(elem).parent().prev().removeClass('active');
      })
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

    $('.submit').click(function () {
      sanitizeFormInput();
      var form = $('#register-form');
      if (form.valid()) {
        var selectedSong = $('#song').val();
        var requesterNote = tinymce.get('requester_note').getContent();
        var selectedSongObj = getSelectedSong(selectedSong, $scope.songs);
        $scope.preview = {
          thumbnailUrl: selectedSongObj.thumbnailUrl,
          songName: selectedSongObj.songName,
          song: selectedSongObj.value,
          artist: selectedSongObj.artist,
          contentName: $scope.form.contentName,
          stepchartType: $scope.form.stepchartType,
          stepchartLevel: $scope.form.stepchartLevel,
          stepmaker: $scope.form.stepmaker,
          requester: $scope.form.requester,
          requesterNote: requesterNote,
          ucsLink: $scope.form.ucsLink,
          email: $scope.form.email,
        }
        $scope.$apply();
        $('#preview-modal').modal('show');
      }
    })

    $('#preview-modal').on('show.bs.modal', function (e) {
      // do something...
      $('.preview-value').each(function(index, elem) {
        var targetElem = $(elem).get(0);
        $clamp(targetElem, {clamp: 2});
      })
    });

    $('#confirm-submit').click(function () {
      var processingState = '<i class="fas fa-circle-notch fa-spin"></i> Processing';
      var defaultState = 'Yes, submit this';
      var self = this;
      $(self).empty().append(processingState);
      $(':button').prop('disabled', true);

      var previewData = $scope.preview;
      var submitData = _.assign({}, { _csrf: $scope._csrf }, previewData)
      submitData = _.omit(submitData, ['songName', 'artist', 'thumbnailUrl']);
      
      axios.post('/register', submitData)
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
          $(self).empty().append(defaultState);
          $('#preview-modal').modal('hide');
          $(':button').prop('disabled', false);
          Swal({
            title: 'Oof...',
            html: 'An error occured while registering, please try again later<br><strong>Error: </strong>' + _.isEmpty(error.response) ? (error.response.data.message || error.response) : error.message,
            type: 'error',
            allowOutsideClick: false,
            confirmButtonText: 'OK'
          })
        })
    })

    $('#preview-modal').on('show.bs.modal', function (e) {
      // do something...
      if (previewThumbnailInstance) {
        $('#preview-thumbnail').remove();
        $('#preview-thumbnail-wrapper').append('<img id="preview-thumbnail" class="img-fluid preview-thumbnail" data-src="' + $scope.preview.thumbnailUrl + '" />')
      }

      previewThumbnailInstance = $('.preview-thumbnail').Lazy({
        effect: 'fadeIn',
        effectTime: 500,
        bind: "event",
        beforeLoad: function (element) {
          $(element).addClass('loading');
        },
        // called after an element was successfully handled
        afterLoad: function (element) {
          $(element).removeClass('loading');
        },
      })

    })

    $('#preview-modal').on('hidden.bs.modal', function (e) {
      $scope.preview = null;
    })
  })

});

registerAppModule.config(function ($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
});

registerAppModule.config(['$compileProvider', function ($compileProvider) {
  $compileProvider.debugInfoEnabled(false);
  $compileProvider.commentDirectivesEnabled(false);
  $compileProvider.cssClassDirectivesEnabled(false);
}]);

//  ----------------------------------- END ANGULAR ------------------------------------------------------------------

function getSelectedSong(selectedSong, songs) {
  var selectedSongObj;
  _.forEach(songs, function (item) {
    var songItems = item.items;
    var selectedItem = _.find(songItems, { 'value': selectedSong });
    if (!_.isEmpty(selectedItem)) {
      selectedSongObj = selectedItem;
      return false;
    }
  });
  return selectedSongObj;
}

function sanitizeFormInput() {
  $("#register-form").each(function () {
    var inputs = $(this).find(':input[type="text"]');
    _.forEach(inputs, function(input) {
      var targetInput = $(input);
      var sanitizedValue = decodeHTMLEntities(sanitizeParam(targetInput.val()));
      targetInput.val(sanitizedValue);
      // //update angular ng-model
      var updateAngularModelEvent
      if (typeof(Event) === 'function') {
        updateAngularModelEvent = new Event("input", { bubbles: true });
      } else{
        updateAngularModelEvent = document.createEvent('Event');
        updateAngularModelEvent.initEvent('input', true, true);
      }
      input.dispatchEvent(updateAngularModelEvent);
    })
  });  
}

function sanitizeParam(dirty) {
  var sanitized = sanitizeHtml(dirty, {
    allowedTags: [],
    allowedAttributes: [],
  });

  return sanitized.trim();
}

function initTextArea() {
  try {
    return Promise.resolve(
      tinymce.init({
        selector: '#requester_note',
        menubar: false,
        statusbar: false,
        height: 350
      }))
  } catch (err) {
    return Promise.reject(err);
  }
}

function initSongSelectField() {
  $('#song').select2({
    escapeMarkup: function (markup) {
      return markup;
    },
    // templateResult: function (data) {
    //   return data.text;
    // },
    // templateSelection: function (data) {
    //   return data.text;
    // },
    width: '100%',
  });
}

function manipulateSongData(songData) {
  return _.map(songData, function (item) {
    var songItems = _.map(item.items, function (songItem) {
      return _.assign({}, songItem, {
        title:
          '<div class="song-wrapper"><strong class="song-name">' + songItem.songName + '</strong><br><span class="song-artist">' + songItem.artist + '</span></div>',
      })
    })
    songItems = _.sortBy(songItems, ['songName', 'artist']);
    return {
      groupName: item.groupName,
      items: songItems
    }
  })
}

//  Start Form Validation

$.validator.addMethod("isUrlValid", function (value, element) {
  return this.optional(element) || /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
}, "Invalid Download Link, Please enter valid Download Link");

// $.validator.addMethod("isUrlValid", function (value, element) {
//   return this.optional(element) || /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
// }, "Invalid Download Link, Please enter valid Download Link");
$.validator.addMethod("isPiuUcsUrl", function(value, element) {
  var url = 'http://www.piugame.com/bbs/board.php?bo_table=ucs&wr_id=';
  return value.includes(url)
}, "We only accept request which download url has format from PIU Official UCS Page : <br><strong>Example:</strong> http://www.piugame.com/bbs/board.php?bo_table=ucs&wr_id={{your_ucs_id}}");

$.validator.addMethod("isEmailValid", function (value, element) {
  return this.optional(element) || /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
}, "Please enter valid email");

// $.validator.addMethod('isEmailDomainBlacklist', function (value, element) {
//     return this.optional(element) || /^([\w-.]+@(?!yahoo)([\w-]+.)+[\w-]{2,4})?$/.test(value);    
//     // return this.optional(element) || /^[^@]+@(yahoo|ymail|rocketmail)\.(com|in|co\.uk)$/i.test(value);
// }, "Your email domain is not recommended, try using another email domain such as: Gmail, Naver, Outlook");

var formRules = {
  requester: 'required',
  song: 'required',
  stepchartLevel: 'required',
  stepchartType: 'required',
  stepmaker: 'required',
  ucsLink: {
    required: true,
    isUrlValid: true,
    isPiuUcsUrl: true
  },
  email: {
    required: true,
    isEmailValid: true,
    maxlength: 63
  },
  terms: 'required'
};

var formErrorMessages = {
  requester: "Please enter your name / nickname",
  song: "Please choose song",
  stepchartLevel: "Please choose stepchart level",
  stepchartType: "Please choose stepchart type",
  stepmaker: "Please enter STEPMAKER name",
  ucsLink: {
    required: "Please enter UCS Download Link"
  },
  email: {
    required: "Please enter your email",
  },
  terms: 'Please read and accept the terms'
}

var formValidObj = $("#register-form").validate({
  onfocusout: function (element) {
    return false;
  },
  rules: formRules,
  messages: formErrorMessages,
  errorElement: "div",
  errorClass: 'is-invalid',
  errorClassFormGroup: 'has-danger is-focused',
  errorPlacement: function (error, element) {
    // Add the `help-block` class to the error element
    error.addClass("invalid-feedback");

    if (element.prop("type") === "checkbox") {
      error.insertAfter(element.next());
    }
    else {
      if (!element.hasClass("form-control") && element.is('select')) {
        error.insertAfter(element.next());
        // element.next().append(error);
      } else {
        error.insertAfter(element);
      }
    }
  },
  highlight: function (element, errorClass, errorClassFormGroup) {
    var targetElem = $(element);

    targetElem.parents('.form-group').find('.col-form-label').addClass('label-invalid');

    if (!targetElem.is('select') || (targetElem.hasClass('form-control') && targetElem.is('select'))) {
      targetElem.parents('.form-group').addClass(errorClassFormGroup);
      targetElem.addClass(errorClass);
    } else if (targetElem.hasClass('bss-select2') && targetElem.is('select')) {
      var select2Elem = targetElem.next().find("span[aria-labelledby='select2-" + targetElem.attr('id') + "-container']");
      select2Elem.addClass('select2-invalid');
    }
  },
  unhighlight: function (element, errorClass, errorClassFormGroup) {
    var targetElem = $(element);

    targetElem.parents('.form-group').find('.col-form-label').removeClass('label-invalid');

    if (!targetElem.is('select') || (targetElem.hasClass("form-control") && targetElem.is('select'))) {
      targetElem.parents(".form-group").removeClass(errorClassFormGroup);
      targetElem.removeClass(errorClass);
    } else if (targetElem.hasClass("bss-select2") && targetElem.is('select')) {
      var select2Elem = targetElem.next().find("span[aria-labelledby='select2-" + targetElem.attr('id') + "-container']");
      select2Elem.removeClass('select2-invalid');
    }
  },
  invalidHandler: function (form, validator) {
    if (!validator.numberOfInvalids())
      return;

    window.scrollTo(0, $(validator.errorList[0].element).offset().top - 130);
    $(validator.errorList[0].element).focus();
    return false;
  }
});

$('#reset').click(function () {
  resetForm();
});

function resetForm() {
  formValidObj.resetForm();
  var form = $('#register-form');
  form.find('input:text, select, textarea').val('');
  form.find('input:radio, input:checkbox').prop('checked', false);
  $('select').val(null).trigger("change");
  tinymce.activeEditor.setContent('');
}

//  End Form Validation