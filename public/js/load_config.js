// This loads the configuration file and updates the page
// We wait for the window to load so that there's no flickering
$(window).on('load', function() {
	$.getJSON('/config', function(json) {
		for (var key in json) {
			$('#' + key).css('display', json[key].display);
		}
	});
	// Fade in when the body has been updated.
	$('body').fadeIn(3000);
});
