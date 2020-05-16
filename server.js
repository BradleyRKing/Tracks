'use strict';

const express = require('express');
var bodyParser = require('body-parser');
const { Server } = require('ws');
const editJsonFile = require('edit-json-file');
var session = require('express-session');
var authMiddleware = require('./middleware/auth');
const dotenv = require('dotenv');
var cors = require('cors');
dotenv.config();

const tracks = require('./routes/tracks');

const app = express();

// Allow content from other origins
app.use(cors());
app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

// Use to handle post requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Port for HTTP server.
const PORT = process.env.PORT || 3000;

// Login session
app.use(
	session({
		secret            : 'secret',
		resave            : false,
		saveUninitialized : false,
		cookie            : { maxAge: 10800000 } // Expires after 3 hours
	})
);

// Serve CSS assets before login, so the login page looks good.
app.use(express.static(__dirname + '/public/css'));

let server = app
	.get('/', function(req, res) {
		if (req.session.loggedIn) {
			res.redirect('/home');
		} else {
			res.sendFile(__dirname + '/public/pages/login.html');
		}
	})
	.listen(PORT, () => console.log(`Listening on ${PORT}`));

// Check form for login. This will initialize a session
// This is not a secure method to log in generally, but will do for this app.
app.post('/auth', function(req, res) {
	var password = req.body.password;
	if (password) {
		// Set's role to admin
		if (password == process.env.ADMIN_AUTH) {
			console.log('Admin has logged in');
			req.session.role = 'admin';
			req.session.loggedIn = true;
			res.redirect('/master');
		} else if (password == process.env.BASIC_AUTH) {
			req.session.role = 'audience';
			req.session.loggedIn = true;
			res.redirect('/home');
		} else {
			res.sendFile(__dirname + '/public/pages/wrong_password.html');
		}
	} else {
		res.send('Please enter password');
		res.end();
	}
});

// Now require auth for all future requests
app.use('/*', authMiddleware.audienceAuth);

// Serve static assets from the public folder
// This needs to come after the initial login so that the index.html does not immediately appear.
app.use(express.static(__dirname + '/public'));

// This handles track routing.
app.use('/tracks', tracks);

app.get('/home', function(req, res) {
	res.sendFile(__dirname + '/public/pages/index.html');
});

// JSON config file requests. This keeps the configuration on the server side.
app.get('/config', function(req, res) {
	res.sendFile(__dirname + '/config.json');
	//console.log('Config requested');
});

// View Counter Page
// Master page
// This requires the second piece of authorization middleware
app.get('/viewer', authMiddleware.adminAuth, function(req, res) {
	res.sendFile(__dirname + '/public/pages/viewer.html');
});

// Master page
// This requires the second piece of authorization middleware
app.get('/master', authMiddleware.adminAuth, function(req, res) {
	res.sendFile(__dirname + '/public/pages/master.html');
	console.log('Master page is active');
});

// Toggle requests from master
app.post('/master', function(req, res) {
	var category = req.body.category;
	var ID = req.body.ID;
	var status = '';

	console.log('Received request:', category, ',', ID);

	// This edits the config file when requests come from the master page
	let file = editJsonFile(`${__dirname}/config.json`);
	if (file.get(`${category}.${ID}`).display == 'none') {
		// Set's whether it is turning on or off
		// 'none' means it's turning on
		status = 'on';

		// Change CSS display depending on element
		if (category == 'track_buttons') {
			file.set(`${category}.${ID}.display`, 'inline-flex');
		} else {
			file.set(`${category}.${ID}.display`, 'block');
		}
	} else {
		status = 'off';
		file.set(`${category}.${ID}.display`, 'none');
	}
	file.save();

	// Update HTML to show elements with the ID
	// This is only send to audience members
	if (Object.keys(clientObj.audience).length > 0) {
		Object.keys(clientObj.audience).forEach((client) => {
			clientObj.audience[client].send(ID);
		});
	}

	// Similarly, send it back to the master clients
	// This ensures the toggle state remains the same, even
	// if multiple users are managing the controls, and it
	// ensures that the user knows the change succeeded.
	if (Object.keys(clientObj.master).length > 0) {
		Object.keys(clientObj.master).forEach((client) => {
			clientObj.master[client].send(JSON.stringify({ id: ID, status: status }));
		});
	}

	res.end();
});

// Logout
app.get('/logout', function(req, res) {
	// destroy the user's session to log them out
	// will be re-created next request
	req.session.destroy(function() {
		res.redirect('/');
	});
});

// This takes the server as an argument so that it's listening
const wss = new Server({ server });
// Not a great implementation for counting viewers on each track, but
// it will do in a pinch.
var COUNTER = [
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0
];

// Websocket objects, used to store different types of clients
// (so we can message specific clients depending on their use)
// We'll use a very rudimentary ID system
var clientObj = { audience: {}, viewer: {}, master: {} };
//var viewerObj = {};
//var masterObj = {};

// ID variable. This will increment with each new socket
var wsId = 0;

// We need to keep the signal alive, or else it will close.
// Empty function to send
function noop() {}

// This sets the "alive" status of a websocket
function heartbeat() {
	this.isAlive = true;
}

// This listens for and logs connections and disconnections.
wss.on('connection', (ws) => {
	console.log('Client connected');
	console.log('Total Sockets: ', wss.clients.size);

	// Set websocket ID
	ws.id = wsId;

	// Increment ID
	wsId++;

	// Set the alive status
	ws.isAlive = true;

	// If a pong is received from a ping, ensure that the socket is alive
	// Pong messages are automatically send after a ping
	// This keeps the socket connection alive. If there is no pong,
	// the socket will be terminated (see below)
	ws.on('pong', heartbeat);

	// This does a few things.
	// Message received from client. Only useful for page view counter
	// The messages are always a json string with a type (counter, viewer, master)
	ws.on('message', function incoming(message) {
		var jsonObj = JSON.parse(message);

		// This comes from the home page and track pages
		// It's used to keep track of viewers on each page
		// The jsonObj will include a track number to determine which track
		// the client is viewing (track 0 is the home page)
		if (jsonObj.type == 'counter') {
			// Set the client type
			ws.type = 'audience';

			// We add this item to reduce the counter at disconnect
			ws.track = jsonObj.track;
			COUNTER[ws.track] = COUNTER[ws.track] + 1;

			// Update views page
			// This only sends to the viewer clients
			if (Object.keys(clientObj.viewer).length > 0) {
				Object.keys(clientObj.viewer).forEach((client) => {
					clientObj.viewer[client].send(COUNTER.toString());
				});
			}
		} else if (jsonObj.type == 'viewer') {
			// Set the client type
			ws.type = 'viewer';

			// Send the counter array to initialize the page
			// This isn't looped (unlike above) because this is an initialization,
			// not an update
			ws.send(COUNTER.toString());
		} else if (jsonObj.type == 'master') {
			// Set the client type
			ws.type = 'master';
		} else {
			// There's only these types, so any extras should be rejected
			ws.close();
		}

		// Now that the client type has been set, save the websocket to the
		// audienceObj, for quick recalls.
		clientObj[ws.type][ws.id] = ws;
		//console.log(clientObj);
	});

	// Closing function. This removes the entry from the clientObj as well
	ws.on('close', function() {
		console.log('Client disconnected');

		// Remove from clientObj
		delete clientObj[ws.type][ws.id];

		// Update counter
		COUNTER[ws.track] = COUNTER[ws.track] - 1;
		// Update views page
		if (Object.keys(clientObj.viewer).length > 0) {
			Object.keys(clientObj.viewer).forEach((client) => {
				clientObj.viewer[client].send(COUNTER.toString());
			});
		}
	});
});

// Ping the client every 30 seconds
const interval = setInterval(function ping() {
	wss.clients.forEach(function each(ws) {
		// Terminate hanging sockets.
		if (ws.isAlive === false) {
			// Remove from clientObj
			// Occasionally, one slips through without an ID, so we check first.
			if (ws.id) {
				delete clientObj[ws.type][ws.id];
				return ws.terminate();
			} else {
				return ws.terminate();
			}
		}
		ws.isAlive = false;
		ws.ping(noop);
	});

	// Show me how many clients are left
	console.log('Audience Clients:', Object.keys(clientObj.audience).length);
	console.log('Master Clients:', Object.keys(clientObj.master).length);
	console.log('Viewer Clients:', Object.keys(clientObj.viewer).length);
}, 30000);

// Clear the interval on close (so it quits pinging the clients).
// This is when the server closes, not the individual sockets
wss.on('close', function close() {
	clearInterval(interval);
});

// This gives a "Page Not Found" Error. It's the last get request so
// everything else tried first.
app.use(function(req, res) {
	res.status(404);
	res.sendFile(__dirname + '/public/pages/page_not_found.html');
});
