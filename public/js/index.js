// This loads any buttons that are available, based on the configuration file.
$(window).on('load', function() {
	$.getJSON('/config', function(json) {
		for (var key in json.track_buttons) {
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

		// Everything else
		for (var category in json) {
			if (category != 'track_buttons') {
				for (var key in json[category]) {
					$('#' + key).css('display', json[category][key].display);
				}
			}
		}
		$('body').hide().css('visibility', 'visible').fadeIn('3000');
	});

	// What is this doing here?
	/*
	$.getJSON('/config', function(json) {
		// Load buttons
		for (var category in json) {
			for (var key in json[category]) {
				$('#' + key).css('display', json[category][key].display);
			}
		}

		// This is placed in here so it happens after everything else loads.
		$('body').hide().css('visibility', 'visible').fadeIn('3000');
	});
	*/
});
