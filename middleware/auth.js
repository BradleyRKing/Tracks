const express = require('express');
var path = require('path');

// Generic authorization, as long as they've entered a password for the site and
// have a defined role, this will work.
function audienceAuth(req, res, next) {
	if (req.session.loggedIn) {
		return next();
	} else {
		res.redirect('/');
	}
}

function adminAuth(req, res, next) {
	if (req.session.role === 'admin') {
		return next();
	} else {
		res.status(401);
		res.sendFile(path.join(__dirname, '../public/pages/not_auth.html'));
	}
}

module.exports = {
	audienceAuth : audienceAuth,
	adminAuth    : adminAuth
};
