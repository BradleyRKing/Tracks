function connect() {
	var HOST = location.origin.replace(/^http/, 'ws');
	var ws = new WebSocket(HOST);

	var message = {
		type : 'viewer'
	};

	ws.onopen = function open() {
		ws.send(JSON.stringify(message));
	};

	// Update the values when a counter is received
	ws.onmessage = function(counter) {
		//console.log(counter);
		var count_array = counter.data.split(',');

		// It's also receiving IDs from the master page.
		// This will do a quick check to make sure it's greater than 0 length

		if (count_array.length > 1) {
			for (var track in count_array) {
				$('#' + track).text(count_array[track]);
			}
		}
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
