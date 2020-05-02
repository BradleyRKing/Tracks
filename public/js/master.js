// Initialize the toggle buttons with ids as tracks
$.getJSON('/config', function(json) {
	for (var key in json) {
		$('.buttonwrapper').append(
			'<div style="padding: 10px;"><p>Track ' +
				key.slice(-1) +
				'<br><br><label class="switch"><input type="checkbox" id="' +
				key +
				'" onclick="submitToggle(this.id)"><span class="slider round"></span></label></p></div>'
		);
		// Make checked if it's visible
		if (json[key].display != 'none') {
			$('#' + key).attr('checked', 'checked');
		}
	}
});

// Handle post requests from toggles
function submitToggle(trackId) {
	$.post(
		'/master',
		{ ID: trackId }, // data to be submit
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
