# mysql-sync

## Intention

mysql-sync brings realtime behavior to your MySQL Database. Working with Google Firebase/Firestore, I noticed that web-developers are looking for some similar realtime behavior on their existing MySQL Database.

## Architectural Overview

mysql-sync consists of:

- [mysql-sync-server](./server/README.md): a node.js / Express server providing the realtime behavior for CRUD (create, read, update, delete) applications based on MySQL database.

- [mysql-sync-client](./client/AngularMysqlSyncDemo/projects/mysql-sync-client/README.md): npm-library which handels the communication to the server. It provides the client-side CRUD interface as well as the possibility to access the data objects as rxjs Observables. The interface is designed as an Injectable Angular service for easy integration in AngularNG or ionic apps.

- [mysql-sync-common](./client/AngularMysqlSyncDemo/projects/mysql-sync-common/README.md): npm-library which provides the common interfaces of the data- and transfer-objects used by client and server.

- [AngularMysqlSyncDemo](./client/AngularMysqlSyncDemo/README.md): Demo CRUD application written in AngularNG. It's derived from the popular Tour of Heros application of the official Angular Tutorial.

![Architectural Overview](https://github.com/adisoftware-ch/mysql-sync/blob/master/architecture_mysql-sync.jpg?raw=true)

## Running the Demo Application

To run the demo application on your local machine, follow these steps. A running demo application will be provided soon on adisoftware.ch

### Install and Prepare MySQL

As mysql-sync handels MySQL database usage, a running instance of MySQL is required. Provide one on the local or any remote machine of your desire.

Note: The server component has to be able to connect to MySQL. There are no direct database connections from client side!

Prepare database `friends` with following tables:
```

```

Provide some simple access rules:
```

```

### Prepare node.js / Angular Projects

1. Clone the git repo to a local directory of your desire. At top level, you find an eclispe project, if you wish to view or edit the code in eclipse.
2. Open the project folder in a terminal:
   - cd to ./server/mysql-sync-server
   - run `npm init`
   - cd to ./client/AngularMysqlSyncDemo
   - run `npm init`

### Prepare Google Firebase Project



### Configure Server

Server-side configuration resides at `./server/mysql-sync-server/src/assets/config.development.json`resp. `config.production.json`. Structure is as follows:
```
{
    "server_port": 3000,        -> the port your websocket server will be listening on
    "maxSocketListeners": 20,   -> max number of sockets
    "secure": false,            -> if true, websocket connection will be handled over wss. provide key/cert in secureconfig
    "secureconfig": {
        "key": "",
        "cert": "",
        "passphrase": ""
    },
    "mysql": {
        "connectionLimit"   : 10,               -> connection limit for mysql connection pool
        "host"              : "localhost",      -> mysql host
        "user"              : "...",            -> mysql database user to connect with
        "password"          : "...",            -> password of mysql database user
        "database"          : "friends"         -> database to be used
    },
    "firebaseAuth": {
        "forceAuth"         : true,             -> if true, only authenticated users will be accepted
        "emailVerification" : true,             -> id true, only users having verified there email address will be accepted
        "firebase": {                           -> firebase config as prepared earlier in. used for user authentication
            "apiKey"            : "...",
            "authDomain"        : "...",
            "databaseURL"       : "...",
            "projectId"         : "...",
            "storageBucket"     : "",
            "messagingSenderId" : "...",
            "appId":            "..."
        }
    }
}
```

### Configure Client

Client-side configuration resides at `./client/AngularMysqlSyncDemo/src/environments/environment.ts` resp. `environment.prod.ts`. Structure is as follows:


```
export const environment = {
  production: false,                                -> if true, config which is used in production build
  dataProvider: {
    requireAuthToken  : true,                       -> if true, authentication is expected
    secure            : false,                      -> if true, connection to websocket server is handled via wss. provide secureconfig, if so
    socketurl         : 'http://localhost:3000',    -> url of mysql-sync-server
    secureconfig      : {
      ca : ''
    }
  },
  firebase: {                       -> firebase config as prepared earlier in. used for user authentication
    apiKey: '...', 
    authDomain: '...',
    databaseURL: '...',
    projectId: '...',
    storageBucket: '',
    messagingSenderId: '...',
    appId: '...'
  }
};
```

### Build Libraries

1. cd to ./client/AngularMysqlSyncDemo
2. run `ng build mysql-sync-common`
3. run `ng build mysql-sync-client`
4. copy mysql-sync-common (whole folder) from ./client/AngularMysqlSyncDemo/dist to ./server/mysql-sync-server/node_modules

### Run Server

1. start your MySQL Server (e.g. on Mac run `mysql.server start`)
2. cd to ./server/mysql-sync-server
3. run `npm run dev` resp. `npm run prod`

### Run Client

1. cd to ./client/AngularMysqlSyncDemo
2. run `ng serve --open` (resp. build production code with `ng build --prod` and deploy it to your productive hosting provider)
3. open client app in your browser on http://localhost:4200 (dev) or the adress of your provider, respectively