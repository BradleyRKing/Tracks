// Initialize the toggle buttons with ids as tracks
$.getJSON('/config', function(json) {
	// Track buttons on home page
	for (var key in json.track_buttons) {
		$('#buttonWrapper').append(
			'<div style="padding: 10px;"><p>Track ' +
				key.slice(-1) +
				'<br>' +
				json.track_buttons[key].artist +
				'<br><br><label class="switch"><input type="checkbox" id="' +
				key +
				'" data-category="track_buttons" onclick="submitToggle($(this).data(\'category\'), this.id)"><span class="slider round"></span></label></p></div>'
		);
		// Make checked if it's visible
		if (json.track_buttons[key].display != 'none') {
			$('#' + key).attr('checked', 'checked');
		}
	}

	// Poll buttons
	for (var key in json.track_polls) {
		$('#pollWrapper').append(
			'<div style="padding: 10px;"><p>' +
				json.track_polls[key].label +
				'<br><br><label class="switch"><input type="checkbox" id="' +
				key +
				'" data-category="track_polls" onclick="submitToggle($(this).data(\'category\'), this.id)"><span class="slider round"></span></label></p></div>'
		);
		// Make checked if it's visible
		if (json.track_polls[key].display != 'none') {
			$('#' + key).attr('checked', 'checked');
		}
	}

	// Home page interactive pieces
	for (var key in json.home_page_interactive) {
		$('#homeWrapper').append(
			'<div style="padding: 10px;"><p>' +
				json.home_page_interactive[key].label +
				'<br><br><label class="switch"><input type="checkbox" id="' +
				key +
				'" data-category="home_page_interactive" onclick="submitToggle($(this).data(\'category\'), this.id)"><span class="slider round"></span></label></p></div>'
		);
		// Make checked if it's visible
		if (json.home_page_interactive[key].display != 'none') {
			$('#' + key).attr('checked', 'checked');
		}
	}

	// Video Player
	for (var key in json.modals) {
		$('#playerWrapper').append(
			'<div style="padding: 10px;"><p>' +
				json.modals[key].label +
				'<br><br><label class="switch"><input type="checkbox" id="' +
				key +
				'" data-category="modals" onclick="submitToggle($(this).data(\'category\'), this.id)"><span class="slider round"></span></label></p></div>'
		);
		// Make checked if it's visible
		if (json.modals[key].display != 'none') {
			$('#' + key).attr('checked', 'checked');
		}
	}
});

// Handle post requests from toggles
function submitToggle(category, trackId) {
	$.post(
		'/master',
		{ category: category, ID: trackId }, // data to be submit
		function(data, status, jqXHR) {
			// success callback
			if (status == 'success') {
				//alert('Track visibility updated');
			} else {
				alert('Oops! Something went wrong...');
			}
		}
	);
}
