var requesterNoteInstance;
var isSongLoaded = false;
var isStepchartTypeLoaded = false;

$(document).ready(() => {
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
		}).then(editor => {
			requesterNoteInstance = editor;
		}).catch(error => {
			console.error(error);
		});
});

//  ----------------------------------- ANGULAR ------------------------------------------------------------------
var appModule = angular.module('registerUcsApp', ['angular.filter']);

appModule.controller('registerUcsCtrl', ($scope, $http, $q) => {
	$scope._csrf = $('input[name="_csrf"]').val();
	$q.when(axios.get(apiUrl + '/stepchart-types')).then(response => {
		$scope.stepchartTypes = response.data;
		isStepchartTypeLoaded = true;
		checkLoader();
	}).catch(error => {
		const { response } = error;
		console.log(response || error);
	});

	$q.when(axios.get(apiUrl + '/songs')).then(response => {
		let songs = response.data;
		$scope.songs = manipulateSongTitle(songs);
		isSongLoaded = true;
		checkLoader();
	}).catch(error => {
		const { response } = error;
		console.log(response || error);
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
			const { songs, requester, contentName, stepchartLevel, stepchartType, stepmaker, ucsLink, email } = $scope;
			const selectedSongVal = $('#song').val();
			const song = getSelectedSong(songs, selectedSongVal);
			const requesterNote = requesterNoteInstance.getData();
			$scope.preview = {
				song, requesterNote, contentName, requester,
				stepchartLevel, stepchartType,
				stepmaker, ucsLink, email
			}
			$scope.$apply();
			setTimeout(function () {
				$('#preview-modal').modal('show');
			})
		}
	});

	$('#confirm-submit').click(function () {
		const self = this;
		const processingState = `<i class="fas fa-circle-notch fa-spin"></i> Processing`;
		const defaultState = 'Yes, submit this';
		$(self).empty().append(processingState);
		$(':button').prop('disabled', true);
		const { song, contentName, email, requester, requesterNote, stepchartLevel, stepchartType, stepmaker, ucsLink } = $scope.preview;
		const data = {
			_csrf: $scope._csrf,
			song: song.value,
			contentName,
			email,
			requester,
			requesterNote,
			stepchartLevel,
			stepchartType,
			stepmaker,
			ucsLink
		}
		// const { song, ...rest } = $scope.preview;
		// const data = {
		// 	song: song.value,
		// 	...rest
		// }
		axios.post('/register', data)
			.then(function (response) {
				setTimeout(function () {
					$(self).empty().append(defaultState);
					$('#preview-modal').modal('hide');
					$(':button').prop('disabled', false);
					const { email } = $scope.preview;
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
				const { response } = error;
				$(self).empty().append(defaultState);
				$('#preview-modal').modal('hide');
				$(':button').prop('disabled', false);
				Swal({
					title: 'Oof...',
					html: `An error occured while registering, please try again later<br>
					<strong>Error: </strong> ${response ? (response.data.message || response) : error.message}`,
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

function manipulateSongTitle(songs) {
	let songItems;

	songItems = Object(songs).map(item => {
		const { artist, songName, group, value, thumbnailUrl } = item;
		return {
			songName,
			artist,
			group,
			title:
				`<div>
				<strong class="song-name">${songName}</strong>
				<br>
				<span class='artist'><span class='artist__label'>Artist:</span> ${artist}</span>
			</div>`,
			value,
			thumbnailUrl
		}
	});

	return songItems
}

function getSelectedSong(songs, selectedSong) {
	return Object(songs).find(item => item.value === selectedSong);
}

function sanitizeFormInput() {
	$("#ucs-register-form").each(function () {
		var inputs = $(this).find(':input[type="text"]');
		Array.prototype.forEach.call(inputs, input => {
			const targetInput = $(input);
			const sanitizedValue = decodeHTMLEntities(sanitizeParam(targetInput.val()));
			targetInput.val(sanitizedValue);
			// //update angular ng-model
			$(input)[0].dispatchEvent(new Event("input", { bubbles: true }));
		});
	});
}

function checkLoader() {
	if (!_.isEmpty(requesterNoteInstance) && isSongLoaded && isStepchartTypeLoaded) {
		$('#form-loader').hide();
	}
}

function sanitizeParam(dirty) {
	var sanitized = sanitizeHtml(dirty, {
		allowedTags: [],
		allowedAttributes: [],
	});

	return sanitized.trim();
}