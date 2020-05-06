'use strict';

const express = require('express');
var bodyParser = require('body-parser');
const { Server } = require('ws');
const editJsonFile = require('edit-json-file');
var session = require('express-session');
var authMiddleware = require('./middleware/auth');
const dotenv = require('dotenv');
dotenv.config();

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

// UPDATE TO HIDE ROUTES FOR TRACKS (so people don't figure out the navigation)
// Use routers in another js file

app.get('/home', function(req, res) {
	res.sendFile(__dirname + '/public/pages/index.html');
});

// JSON config file requests. This keeps the configuration on the server side.
app.get('/config', function(req, res) {
	res.sendFile(__dirname + '/config.json');
	//console.log('Config requested');
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

// This listens for and logs connections and disconnections.
wss.on('connection', (ws) => {
	console.log('Client connected');
	ws.on('close', () => console.log('Client disconnected'));
});

// This gives a "Page Not Found" Error. It's the last get request so
// everything else tried first.
app.use(function(req, res) {
	res.status(404);
	res.sendFile(__dirname + '/public/pages/page_not_found.html');
});
