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

// This makes the links appear.
ws.onmessage = function(ID) {
	$('#' + ID.data).toggle(1500);
};
