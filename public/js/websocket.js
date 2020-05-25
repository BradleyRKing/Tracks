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

	// This makes things appear as toggled on the backend page.
	ws.onmessage = function(ID) {
		console.log('Updating', ID.data);
		if (ID.data.includes('modal')) {
			if (document.getElementById(ID.data).style.display == 'none') {
				document.getElementById(ID.data).style.display = 'block';
			} else {
				document.getElementById(ID.data).style.display = 'none';
			}
		} else if (ID.data.includes('script')) {
			$('#' + ID.data).toggle(3000);
		} else {
			$('#' + ID.data).toggle(1500);
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

// Modal script
// Get the modal
var modal = document.getElementsByClassName('modal')[0];

// Get the <span> element that closes the modal
var span = document.getElementsByClassName('close')[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
	modal.style.display = 'none';
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
	if (event.target == modal) {
		modal.style.display = 'none';
	}
};
