function connect() {
	var HOST = location.origin.replace(/^http/, 'ws');
	var ws = new WebSocket(HOST);

	var message = {
		type : 'master'
	};

	ws.onopen = function open() {
		ws.send(JSON.stringify(message));
	};

	// Update the toggles and display a success message
	ws.onmessage = function(message) {
		var jsonObj = JSON.parse(message.data);
		var id = jsonObj.id;
		var status = jsonObj.status;

		// This will change the state of the toggles to checked or unchecked
		if (status === 'on') {
			$('#' + id).prop('checked', true);
		} else if (status === 'off') {
			$('#' + id).prop('checked', false);
		}
		$('#update-status').html(id + '<br>' + status);
	};

	// Handling some issues with sockets closing.
	ws.onclose = function(e) {
		console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
		setTimeout(function() {
			connect();
		}, 1000);
	};

	ws.onerror = function(err) {
		console.error('Socket encountered error: ', err.message, 'Closing socket');
		ws.close();
	};
}

connect();
