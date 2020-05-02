var HOST = location.origin.replace(/^http/, 'ws');
var ws = new WebSocket(HOST);

ws.onmessage = function(ID) {
	$('#' + ID.data).toggle(1500);
};
