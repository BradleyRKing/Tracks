function connect() {
	var HOST = location.origin.replace(/^http/, 'ws');
	var ws = new WebSocket(HOST);

	// Get track number from URL
	var track = location.pathname.split('/').pop();
	track = track == 'home' ? 0 : parseInt(track);

	var message = {
		type  : 'counter',
		track : track
	};

	ws.onopen = function open() {
		ws.send(JSON.stringify(message));
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
