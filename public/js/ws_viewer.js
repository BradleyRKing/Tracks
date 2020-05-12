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
	//console.log(counter.data.split(','));
	var count_array = counter.data.split(',');

	for (var track in count_array) {
		$('#' + track).text(count_array[track]);
	}
};
