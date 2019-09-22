import express = require("express");

export const router = express.Router();

router.get('/', (req, res) => {
    res.send({response: 'I am alive'}).status(200);
});

router.get('/ping', (req, res) => {
    res.json({alive: 'yes'});
});
