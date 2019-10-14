# MysqlSyncClient

## Intention

npm library for usage of mysql-sync from AngluarNG or ionic applications. It encapsulates the websocket conversations complexity from the client via simple API methods. It provides Observables for the clients to be notified on each others changes.

## Building the Library

- Run `ng build mysql-sync-client` from the project root directory (./client/AngularMysqlSyncDemo)
- Copy `./client/AngularMysqlSyncDemo/dist/mysql-sync-client` (whole folder) to `node_modules` of your AngularNG or ionic project

## CRUD Methods
```
public create(table: string, entity: any)
```
Creates a new entity in table `table`. `entity` is expected to be a simple JSON object according the table's structure. An error will be thrown, otherwise.

```
public read(table: string, conditionclause: string): Observable<IDataObject[]>
```
Reades from `table` according the `conditionclause`. Returns an Observable which allows clients to listen for changes on the underlying record set. The Observable will be updated by the library on CREATE, UPDATE, DELETE calls from any client.

**Attention:** Currently this method is not proof against SQL Injection and requires refactoring of the handling of the condition-clause.

```
public update(table: string, id: string, version: string, entity: any)
```
Performs an update on `table`'s record with ID `id`. `entity`is expected to be a simple json object according the table's structure. `version` has to match the version of the same object in the database. An error will be thrown otherwise.

```
public delete(table: string, id: string, version: string)
```
Deletes `table`'s record with ID `id`. `version` has to match the version of the same object in the database. An error will be thrown otherwise.

## Additional public Methods

```
public getUsersConnected(): Observable<number>
```
Accesses the Observable reporting the amount of currently connected clients.

```
public getErrorMessages(): Observable<any>
```
Accesses the Observable reporting possible error messages.

```
public setAuthToken(token: string)
```
Passes the Firebase Authentication token to the server component. Calling this method performs a reconnect of the websocket connection with the Auth token set in parameter `socket.handshake.query.token`.

`setAuthToken` has to be called from the client application whenever the user authentification changes.

## Todo

- [ ] Add offline functionality
- [ ] Refactor method `read` regarding safety against SQL injection
