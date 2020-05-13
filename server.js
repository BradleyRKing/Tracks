'use strict';

const express = require('express');
var bodyParser = require('body-parser');
const { Server } = require('ws');
const editJsonFile = require('edit-json-file');
var session = require('express-session');
var authMiddleware = require('./middleware/auth');
const dotenv = require('dotenv');
dotenv.config();

const tracks = require('./routes/tracks');

const app = express();

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

	console.log('Received request: ', category, ' , ', ID);

	// This edits the config file when requests come from the master page
	let file = editJsonFile(`${__dirname}/config.json`);
	if (file.get(`${category}.${ID}`).display == 'none') {
		if (category == 'track_buttons') {
			file.set(`${category}.${ID}.display`, 'inline-flex');
		} else {
			file.set(`${category}.${ID}.display`, 'block');
		}
	} else {
		file.set(`${category}.${ID}.display`, 'none');
	}
	file.save();

	// Update main page
	// Websocket required here.
	wss.clients.forEach((client) => {
		client.send(ID);
	});

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

// Page viewer connections
// Fix this to remove extra viewers when they disconnect
var VIEWERS = [];

// We need to keep the signal alive, or else it will close. These functions wil assist with that.
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

	// Set the alive status
	ws.isAlive = true;

	// If a pong is received from a ping, ensure that the socket is alive
	// Pong messages are automatically send after a ping
	ws.on('pong', heartbeat);

	// This is to update the page counter
	// Message received from client. Only useful for page view counter
	ws.on('message', function incoming(message) {
		var jsonObj = JSON.parse(message);

		if (jsonObj.type == 'viewer') {
			ws.send(COUNTER.toString());
			VIEWERS.push(ws);
		}

		if (jsonObj.type == 'counter') {
			// Update counter
			ws.track = jsonObj.track;
			COUNTER[ws.track] = COUNTER[ws.track] + 1;
			// Update views page
			if (VIEWERS.length > 0) {
				VIEWERS.forEach((viewer) => {
					viewer.send(COUNTER.toString());
				});
			}
		}
	});

	ws.on('close', function() {
		clearInterval(interval);
		console.log('Client disconnected');
		// Update counter
		COUNTER[ws.track] = COUNTER[ws.track] - 1;
		// Update views page
		if (VIEWERS.length > 0) {
			VIEWERS.forEach((viewer) => {
				viewer.send(COUNTER.toString());
			});
		}
	});
});

// Ping the client every 30 seconds
const interval = setInterval(function ping() {
	wss.clients.forEach(function each(ws) {
		if (ws.isAlive === false) return ws.terminate();
		ws.isAlive = false;
		ws.ping(noop);
	});
}, 15000);

// Clear the interval on close.
wss.on('close', function close() {
	clearInterval(interval);
});

// This gives a "Page Not Found" Error. It's the last get request so
// everything else tried first.
app.use(function(req, res) {
	res.status(404);
	res.sendFile(__dirname + '/public/pages/page_not_found.html');
});
