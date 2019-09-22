"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
exports.environment = function () {
    try {
        console.log(process.cwd());
        var buffer = fs.readFileSync("./src/assets/config." + process.env.NODE_ENV + ".json");
        try {
            return JSON.parse(buffer.toString());
        }
        catch (err) {
            console.log('Error parsing config:', err);
            throw err;
        }
    }
    catch (err) {
        console.log("Error reading config from ./src/assets/config." + process.env.NODE_ENV + ".json:", err);
        throw err;
    }
};
