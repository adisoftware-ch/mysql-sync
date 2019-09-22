import express = require('express');
import socketIo = require('socket.io');
import mysql = require('mysql');
import http = require('http');
import https = require('https');
import fs = require('fs');
import admin = require('firebase-admin');

import { environment } from '../environments/environment';
import * as db from './db/db';
import * as routes from './routes/routes';

var pool: mysql.Pool;

const app: express.Application = express();
app.use(routes.router);

// Start function
export const start = (port: number): Promise<void> => {
    if (environment().firebaseAuth.forceAuth) {
        admin.initializeApp(environment().firebaseAuth.firebase);
    }

    let server: http.Server | https.Server;

    if (environment().secure) {
        server = https.createServer({
            key: fs.readFileSync(environment().secureconfig.key),
            cert: fs.readFileSync(environment().secureconfig.cert),
            passphrase: environment().secureconfig.passphrase
        }, app);
    } else {
        server = http.createServer(app);
    }

    const io = socketIo(server);

    io.use(function(socket, next) {
        verifyToken(socket, next);
    })
    .on('connection', function(socket){
        // Let all sockets know how many are connected
        io.sockets.emit('sockets:connected', io.sockets.clients.length)
    
        socket.on('disconnect', function() {
            io.sockets.emit('sockets:connected', io.sockets.clients.length)
        })

        socket.on('init', function() {
            if (!pool) {
                pool = mysql.createPool(environment().mysql);

                console.log('mysql connection pool is ready!');
            }
        })
    
        socket.on('create', function(data: db.ITransferObject) {
            if (pool) {
                if (data.attributes) {

                    // if authentication is turned on, store uid with every new record
                    if (socket.client.request.uid) {
                        data.attributes.push({
                            key: 'creator',
                            value: socket.client.request.uid
                        });
                    }

                    db.createEntity(data, mysql, pool, function(error: any,result: any) {
                        if (error) {
                            io.sockets.emit('error', '' + result);
                        } else {
                            console.log('new ' + data.table + ' added!');
                            // On successful addition, emit event for client.
                            io.sockets.emit('create:response', {
                                table: data.table,
                                condition: 'create',
                                value: result
                            });
                        }
                    });
                } else {
                    io.emit('error', 'trying to create a new entity without any attributes');
                }
            } else {
                io.emit('error', 'database connection pool not initialized');
            }
        })

        socket.on('read', function(data: db.ITransferObject) {
            if (pool) {
                db.queryEntity(data, mysql, pool, function(error: any,result: any) {
                    if (error) {
                        io.sockets.emit('error', '' + result);
                    } else {
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
            } else {
                io.emit('error', 'database connection pool not initialized');
            }
        })

        socket.on('update', function(data: db.ITransferObject) {
            if (pool) {
                db.updateEntity(socket.client.request.uid, data, mysql, pool, function(error: any,result: any) {
                    if (error) {
                        io.sockets.emit('error', '' + result);
                    } else {
                        console.log('updated ' + data.table + ':id=' + data.id);
                        // On successful addition, emit event for client.
                        io.sockets.emit('update:response', {
                            table: data.table,
                            condition: 'update',
                            value: result
                        });
                    }
                });
            } else {
                io.emit('error', 'database connection pool not initialized');
            }
        })

        socket.on('delete', function(data: db.ITransferObject) {
            if (pool) {
                db.deleteEntity(socket.client.request.uid, data, mysql, pool, function(error: any,result: any) {
                    if (error) {
                        io.sockets.emit('error', '' + result);
                    } else {
                        console.log('deleted ' + data.table + ':id=' + data.id);
                        // On successful addition, emit event for client.
                        io.sockets.emit('create:response', {
                            table: data.table,
                            condition: 'create',
                            value: result
                        });
                    }
                });
            } else {
                io.emit('error', 'database connection pool not initialized');
            }
        })

    })

    return new Promise<void>((resolve, reject) => {
        server.listen(port, resolve);
    });
};

async function verifyToken(socket: socketIo.Socket, next: any) {
    if (environment().firebaseAuth.forceAuth) {
        console.log('performing firebase auth ..');

        const token = socket.handshake.query.token;

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            if (decodedToken) {
                console.log('user authenticated:', decodedToken);

                if (!environment().firebaseAuth.emailVerification || decodedToken.email_verified) {
                    // store uid for further usage in processing the request
                    socket.client.request.uid = decodedToken.uid;
                    next();
                } else {
                    console.error('Authentication error: EMail not verified');
                    next(new Error('Authentication error: EMail not verified'));
                }
            } else {
                console.error('Authentication error: Token not valid');
                next(new Error('Authentication error: Token not valid'));
            }
        } catch (err) {
            console.error('Authentication error: ' + err);
            next(new Error('Authentication error: ' + err));
        }
    } else {
        console.warn('firebase auth not configured - processing without auth ..');
        next();
    }
}

process.setMaxListeners(environment().maxSocketListeners);

process.on('uncaughtException', function (err) {
    console.error('an uncaught exception happened!');
    console.error(err.stack);
});
