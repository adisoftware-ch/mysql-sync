"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var socketIo = require("socket.io");
var mysql = require("mysql");
var http = require("http");
var https = require("https");
var fs = require("fs");
var environment_1 = require("../environments/environment");
var db = __importStar(require("./db/db"));
var routes = __importStar(require("./routes/routes"));
var pool;
var app = express();
app.use(routes.router);
// Start function
exports.start = function (port) {
    var server;
    if (environment_1.environment().secure) {
        server = https.createServer({
            key: fs.readFileSync(environment_1.environment().secureconfig.key),
            cert: fs.readFileSync(environment_1.environment().secureconfig.cert),
            passphrase: environment_1.environment().secureconfig.passphrase
        }, app);
    }
    else {
        server = http.createServer(app);
    }
    var io = socketIo(server);
    io.sockets.on('connection', function (socket) {
        // Let all sockets know how many are connected
        io.sockets.emit('sockets:connected', io.sockets.clients.length);
        socket.on('disconnect', function () {
            io.sockets.emit('sockets:connected', io.sockets.clients.length);
        });
        socket.on('init', function () {
            if (!pool) {
                pool = mysql.createPool(environment_1.environment().mysql);
                console.log('mysql connection pool is ready!');
            }
        });
        socket.on('create', function (data) {
            if (pool) {
                db.createEntity(data, mysql, pool, function (error, result) {
                    if (error) {
                        io.sockets.emit('error', '' + result);
                    }
                    else {
                        console.log('new ' + data.table + ' added!');
                        // On successful addition, emit event for client.
                        io.sockets.emit('create:response', {
                            table: data.table,
                            condition: 'create',
                            value: result
                        });
                    }
                });
            }
            else {
                io.emit('error', 'database connection pool not initialized');
            }
        });
        socket.on('read', function (data) {
            if (pool) {
                db.queryEntity(data, mysql, pool, function (error, result) {
                    if (error) {
                        io.sockets.emit('error', '' + result);
                    }
                    else {
                        console.log('read from ' + data.table + ':condition=' + data.condition);
                        console.log(result);
                        // On successful addition, emit event for client.
                        io.sockets.emit('read:response', {
                            table: data.table,
                            condition: data.condition,
                            values: result
                        });
                    }
                });
            }
            else {
                io.emit('error', 'database connection pool not initialized');
            }
        });
        socket.on('update', function (data) {
            if (pool) {
                db.updateEntity(data, mysql, pool, function (error, result) {
                    if (error) {
                        io.sockets.emit('error', '' + result);
                    }
                    else {
                        console.log('updated ' + data.table + ':id=' + data.id);
                        // On successful addition, emit event for client.
                        io.sockets.emit('update:response', {
                            table: data.table,
                            condition: 'update',
                            value: result
                        });
                    }
                });
            }
            else {
                io.emit('error', 'database connection pool not initialized');
            }
        });
        socket.on('delete', function (data) {
            if (pool) {
                db.deleteEntity(data, mysql, pool, function (error, result) {
                    if (error) {
                        io.sockets.emit('error', '' + result);
                    }
                    else {
                        console.log('deleted ' + data.table + ':id=' + data.id);
                        // On successful addition, emit event for client.
                        io.sockets.emit('create:response', {
                            table: data.table,
                            condition: 'create',
                            value: result
                        });
                    }
                });
            }
            else {
                io.emit('error', 'database connection pool not initialized');
            }
        });
    });
    return new Promise(function (resolve, reject) {
        server.listen(port, resolve);
    });
};
process.on('uncaughtException', function (err) {
    console.error('an uncaught exception happened!');
    console.error(err.stack);
});
