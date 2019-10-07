import express = require('express');
import socketIo = require('socket.io');
import mysql = require('mysql');
import http = require('http');
import https = require('https');
import fs = require('fs');
import admin = require('firebase-admin');

import { ITransferObject } from 'mysql-sync-common';

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
        io.sockets.emit('sockets:connected', Object.keys(io.sockets.connected).length);
    
        socket.on('disconnect', function() {
            io.sockets.emit('sockets:connected', Object.keys(io.sockets.connected).length)
        })

        socket.on('init', function() {
            if (!pool) {
                pool = mysql.createPool(environment().mysql);

                console.log('mysql connection pool is ready!');
            }
        })
    
        socket.on('create', function(data: ITransferObject) {
            if (pool) {
                db.createEntity(socket.client.request.uid, data, pool, function(error: any,result: any) {
                    if (error) {
                        console.error('error in db.create:', result);
                        socket.emit('error:msg', '' + result);
                    } else {
                        console.log('new ' + data.table + ' added!');
                        // On successful addition, emit event for all clients
                        io.sockets.emit('create:response', {
                            table: data.table,
                            condition: 'create',
                            value: result
                        });
                    }
                });
            } else {
                socket.emit('error:msg', 'database connection pool not initialized');
            }
        })

        socket.on('read', function(data: ITransferObject) {
            if (pool) {
                db.queryEntity(socket.client.request.uid, data, pool, function(error: any,result: any) {
                    if (error) {
                        console.error('error in db.read:', result);
                        socket.emit('error:msg', '' + result);
                    } else {
                        console.log('read from ' + data.table + ':condition=' + data.condition);
                        // On successful addition, emit event for requesting client
                        socket.emit('read:response', {
                            table: data.table,
                            condition: data.condition,
                            values: result
                        });
                    }
                });
            } else {
                socket.emit('error:msg', 'database connection pool not initialized');
            }
        })

        socket.on('update', function(data: ITransferObject) {
            if (pool) {
                db.updateEntity(socket.client.request.uid, data, pool, function(error: any,result: any) {
                    if (error) {
                        console.error('error in db.update:', result);
                        socket.emit('error:msg', result);
                    } else {
                        console.log('updated ' + data.table + ':id=' + data.id);
                        // On successful addition, emit event for all clients
                        io.sockets.emit('update:response', {
                            table: data.table,
                            condition: 'update',
                            value: result
                        });
                    }
                });
            } else {
                socket.emit('error:msg', 'database connection pool not initialized');
            }
        })

        socket.on('delete', function(data: ITransferObject) {
            if (pool) {
                db.deleteEntity(socket.client.request.uid, data, pool, function(error: any,result: any) {
                    if (error) {
                        console.error('error in db.delete:', result);
                        socket.emit('error:msg', '' + result);
                    } else {
                        console.log('deleted ' + data.table + ':id=' + data.id);
                        // On successful addition, emit event for all clients
                        io.sockets.emit('create:response', {
                            table: data.table,
                            condition: 'create',
                            value: result
                        });
                    }
                });
            } else {
                socket.emit('error:msg', 'database connection pool not initialized');
            }
        })

    })

    return new Promise<void>((resolve, _REJECT) => {
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
                if (!environment().firebaseAuth.emailVerification || decodedToken.email_verified) {
                    console.log('User successfully validated!', decodedToken.uid);
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
    console.error('mysql-sync-server, app.ts:','an uncaught exception happened!');
    console.error(err.stack);
});
