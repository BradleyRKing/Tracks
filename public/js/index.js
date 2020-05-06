// This loads any buttons that are available, based on the configuration file.
$(window).on('load', function() {
	$.getJSON('/config', function(json) {
		for (var key in json.track_buttons) {
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
			);
			$('#' + key).css('display', json.track_buttons[key].display);
		}
	});
	// Fade in when the body has been updated.
	$('body').fadeIn(3000);
});
