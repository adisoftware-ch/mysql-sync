# mysql-sync

## Intention

mysql-sync brings realtime behavior to your MySQL Database. Working with Google Firebase/Firestore, I noticed that web-developers are looking for some similar realtime behavior on their existing MySQL Database.

## Project Structure

mysql-sync consists of:

- mysql-sync-server: a node.js / Express server providing the realtime behavior for CRUD (create, read, update, delete) applications based on MySQL database.

- mysql-sync-client: npm-library which handels the communication to the server. It provides the client-side CRUD interface as well as the possibility to access the data objects as rxjs Observables. The interface is designed as an Injectable Angular service for easy integration in AngularNG or ionic apps.

- mysql-sync-common: npm-library which provides the common interfaces of the data- and transfer-objects used by client and server.

- AngularMysqlSyncDemo: Demo CRUD application written in AngularNG. It's derived from the popular Tour of Heros application of the official Angular Tutorial.