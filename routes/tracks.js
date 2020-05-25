'use strict';
const express = require('express');
let router = express.Router();
const path = require('path');

router.post('/:trackId', (req, res) => {
	res.sendFile(path.join(__dirname, '../public/pages/track-' + req.params.trackId + '.html'));
});

module.exports = router;
