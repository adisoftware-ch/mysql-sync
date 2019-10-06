import express = require("express");

export const router = express.Router();

router.get('/ping', (_REQ, res) => {
    res.json({alive: 'yes'}).status(200);
});
