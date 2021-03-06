# mysql-sync

  * [Intention](#intention)
  * [Architectural Overview](#architectural-overview)
  * [Running the Demo Application](#running-the-demo-application)
    + [Install and Prepare MySQL](#install-and-prepare-mysql)
    + [Prepare node.js / Angular Projects](#prepare-nodejs---angular-projects)
    + [Prepare Google Firebase Project](#prepare-google-firebase-project)
    + [Configure Server](#configure-server)
    + [Configure Client](#configure-client)
    + [Build Libraries](#build-libraries)
    + [Run Server](#run-server)
    + [Run Client](#run-client)
  * [Todo](#todo)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>

## Intention

mysql-sync brings realtime behavior to your MySQL Database. Working with Google Firebase/Firestore, I noticed that web-developers are looking for some similar realtime behavior on their existing MySQL Database.

What mysql-sync uses from Googles Firebase is Authentication. Google provides many features on their Authentication service that would be hard to implement. Some examples are:

- registration process with E-Mail verification
- various login methods, including the possbility for social-media login (not used in the demo app)
- console for user administration (password reset, revoke users, ..)

Authentication happens on client- and on server-side. Auth tokens are passed to mysql-sync service and checked against the corresponding Firebase service using Googles Firebase Admin js library.

Additionally, mysql-sync server works with some simple security rules that have to be configured in table `rules` on the MySQL database. As mysql-sync provides a NoSQL-like API towards the client, it secures data access on record level according these rules. Rules can be provided separately for the methods create, read, update, delete.

## Architectural Overview

mysql-sync consists of:

- [mysql-sync-server](./server/mysql-sync-server/README.md): a node.js / Express server providing the realtime behavior for CRUD (create, read, update, delete) applications based on MySQL database. **code base: ./server/mysql-sync-server**

- [mysql-sync-client](./client/AngularMysqlSyncDemo/projects/mysql-sync-client/README.md): npm-library which handels the communication to the server. It provides the client-side CRUD interface as well as the possibility to access the data objects as rxjs Observables. The interface is designed as an Injectable Angular service for easy integration in AngularNG or ionic apps. **code base: ./client/AngularMysqlSyncDemo/projects/mysql-sync-client**

- [mysql-sync-common](./client/AngularMysqlSyncDemo/projects/mysql-sync-common/README.md): npm-library which provides the common interfaces of the data- and transfer-objects used by client and server. **code base: ./client/AngularMysqlSyncDemo/projects/mysql-sync-common**

- [AngularMysqlSyncDemo](./client/AngularMysqlSyncDemo/README.md): Demo CRUD application written in AngularNG. It's derived from the popular Tour of Heros application of the official Angular Tutorial. **code base: ./client/AngularMysqlSyncDemo**

![Architectural Overview](https://github.com/adisoftware-ch/mysql-sync/blob/master/architecture_mysql-sync.jpg?raw=true)

## Running the Demo Application

To run the demo application on your local machine, follow these steps. A running demo application will be provided soon on adisoftware.ch

Preface: This is not an Angular nor a node.js tutorial. For following these steps, it's assumed, that you have a working Angular / node.js environment in place and that you have a common understanding of using these technologies as a developer.

### Install and Prepare MySQL

As mysql-sync handels MySQL database usage, a running instance of MySQL is required. Provide one on the local or any remote machine of your desire.

Note: The server component has to be able to connect to MySQL. There are no direct database connections from client side!

Prepare database `friends` with tables `friend` (the business data) and `rules` (the security rules for data access):
```
CREATE DATABASE `friends`;

CREATE TABLE `friend` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `creator` varchar(250) DEFAULT NULL,
  `name` varchar(250) DEFAULT NULL,
  `version` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE `rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `table` varchar(45) NOT NULL,
  `create` varchar(250) DEFAULT NULL,
  `read` varchar(250) DEFAULT NULL,
  `update` varchar(250) DEFAULT NULL,
  `delete` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

Provide some simple access rules:
```
INSERT INTO `friends`.`rules` (`table`,`read`,`update`,`delete`)
VALUES (
`friend`,
`select id from friend where creator=?`,
`select id from friend where creator=?`,
`select id from friend where creator=?`);
```

Note that we didn't create any access rule for method `create`. Given so, mysql-sync-server will still check, if a user trying to create friend-entries is successfully authenticated. But any authenticated user will be able to create as many friends as he likes.

This behavior is not acceptable in production. But for the case of simplicity, the demo app doesn't have any user roles which would be necessary to check `create` rules (as at the moment of `create` theres no data, which could be checked against - like ownership in the other examples).

### Prepare node.js / Angular Projects

1. Clone the git repo to a local directory of your desire. At top level, you find an eclispe project, if you wish to view or edit the code in eclipse.
2. Open the project folder in a terminal:
   - cd to ./server/mysql-sync-server
   - run `npm init`
   - cd to ./client/AngularMysqlSyncDemo
   - run `npm init`

### Prepare Google Firebase Project

This is just a very short description of the steps required to configure the demo application. It's strongly recommended to check Googles latest documentation on configuring Firebase.

1. Using your web browser, go to [https://firebase.google.com](https://firebase.google.com) and register a free Firebase account (Spark Plan)
2. Access Firebase Console at [https://console.firebase.google.com](https://console.firebase.google.com)
3. Create a new Firebase Project (e.g. `mysql-sync-demo`)
4. Go to `Authentication` => `Authentication Method` and enable E-Mail/Password Authentication. Ensure that `Requires E-Mail Verification` is checked.
5. Still in Firebase Console add a Web-Application to your project
6. Open project settings, scroll down to the `Web-Apps` part and copy the info from `firebase sdk snippet` for further usage in next chapters.

Note 1: You should create two distinct Web Applications for your mysql-sync-server-config and for your mysql-sync-client-config. Server-side access keys should not be exposed via clients.

Note 2: Never push this Firebase config to a public Git Repo. It contains your private access keys.

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
4. copy `./client/AngularMysqlSyncDemo/dist/mysql-sync-common` (whole folder) to `./server/mysql-sync-server/node_modules`

### Run Server

1. start your MySQL Server (e.g. on Mac run `mysql.server start`)
2. cd to ./server/mysql-sync-server
3. run `npm run dev` resp. `npm run prod`

### Run Client

1. cd to ./client/AngularMysqlSyncDemo
2. run `ng serve --open` (resp. build production code with `ng build --prod` and deploy it to your productive hosting provider)
3. open client app in your browser on http://localhost:4200 (dev) or the adress of your provider, respectively

## Todo

- [ ] Provide working version of the demo app on adisoftware.ch
- [ ] Provide a better description for secure config