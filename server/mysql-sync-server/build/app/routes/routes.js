"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
exports.router = express.Router();
exports.router.get('/', function (req, res) {
    res.send({ response: 'I am alive' }).status(200);
});
exports.router.get('/ping', function (req, res) {
    res.json({ alive: 'yes' });
});
