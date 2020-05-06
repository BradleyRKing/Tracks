var HOST = location.origin.replace(/^http/, 'ws');
var ws = new WebSocket(HOST);

// This makes the links appear.
ws.onmessage = function(ID) {
	$('#' + ID.data).toggle(1500);
};
