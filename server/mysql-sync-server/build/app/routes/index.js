"use strict";
var express = require("express");
var router = express.Router();
router.get('/', function (req, res) {
    res.send({ response: 'I am alive' }).status(200);
});
router.get('/ping', function (req, res) {
    res.json({ alive: 'yes' });
});
module.exports = router;
