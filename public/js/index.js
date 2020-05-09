// This loads any buttons that are available, based on the configuration file.
$(window).on('load', function() {
	$.getJSON('/config', function(json) {
		for (var key in json.track_buttons) {
			/*
			$('#track-buttons').append(
				'<a id=' +
					key +
					' href="pages/track-' +
					key.slice(-1) +
					'.html"><button class="button"><span>' +
					json.track_buttons[key].artist +
					'</span><img src="images/' +
					json.track_buttons[key].icon +
					'"></button></a>'
			);*/

			$('#track-buttons').append(
				'<form id="' +
					key +
					'" action="tracks/' +
					key.slice(-1) +
					'" method="POST">' +
					'<button type="submit" class="button"><span>' +
					json.track_buttons[key].artist +
					'</span><img src="images/' +
					json.track_buttons[key].icon +
					'"></button>' +
					'</form>'
			);
			$('#' + key).css('display', json.track_buttons[key].display);
		}
	});

	$.getJSON('/config', function(json) {
		// Load buttons
		for (var category in json) {
			for (var key in json[category]) {
				$('#' + key).css('display', json[category][key].display);
			}
		}
	});
	// Fade in when the body has been updated.
	// We do it this way (rather than display:none) so that world of text loads properly
	// WOT has issues if it starts as display:none because of width calculations.
	$('#worldOfText').css('visibility', 'visible').hide();
	$('body').hide().css('visibility', 'visible').fadeIn('3000');
});
