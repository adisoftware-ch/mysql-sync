## Intention

websocket server that provides a realtime, NoSQL-like API to your MySQL database.

Many web applications are still based on MySQL database. mysql-sync enables to keep on using MySQL while benefitting from realtime functionality such as notification on data updates between different clients.

For CRUD data manipulation, mysql-sync-server offers a simple NoSQL-like API. This includes checking authorisation against (very simple) security rules that can be configured inside the MySQL database.

Furthermore, mysql-sync-server offers the possiblity to use Firebase Auth tokens for user authentication. 

By cloning the project, you can easyli extend the CRUD API as well as the security rules concept (authorisation) or adapt for other authentication token providers than Google Firebase. See the specific sections for implementation details.

## Building and Running the Server

See [mysql-sync](../../README.md) for building and running mysql-sync

## Implementation Details

The most important documentation is the code itself. To provide some navigation, a short description of the main principles is provided here.

### The Server Application

mysql-sync-server is written as a TypeScript application. It's structure is simple. The most important files are sketched in following table.

| File | Description |
| --- | --- |
| package.json | Defines all required npm modules (except our own module `mysql-sync-common` which is added manually). Defines the start scripts for development (`npm start dev`) and production (`npm start prod`) |
| tsconfig.json | Configuration of TypeScript application. The file will be created by npm init. Only change is the outDir for productive compilation which is set to ./build |
| main.ts | Entry point referenced from the start scripts. Starts the server and prints a confirmation message to console, if successful. |
| ./app/app.ts | The server: Method start configures and starts a node.js Express server, which handels the websocket connections required for the CRUD services; including Firebase Authentication checking, if configured. |
| ./app/routes/routes.ts | Very simple router for our Express server. It provides exactly one single route to the ping service to check, if the server is alive. This function is currently unused. |
| ./app/db/db.ts | Module, which provides all functions for database access, checking of security rules and checking of conficting update or delete operations. |
| ./environments/environment.ts | Helper method to access prod resp. dev environment depending on process env variable `NODE_ENV` |
| ./assets/config...json | Config files for mysql-sync-server as described in [Main README.md](../../README.md) |

### CRUD API (over websocket)

| Socket Event | Description | Answer (Event) | BC | SI |
| --- | --- | --- | --- | --- |

### Exception Handling

Exceptions are caught and passed to the requesting client with socket event `error:msg`. Most parts of the server application are written using callback-functions, witch return results - including possible errors - back to `./app/app.ts` with the main socket event listeners.

(Attention: If adapting the code, don't use `error` for the name of these socket events. It would trigger the listener for uncaught exceptions.)

If an ancaught exception happens, `./app/app.ts`defines a listener on the express server process that logs the exception to console and lets the process continue. Without this function, the server would stop on uncaught exceptions by default.

### Firebase Authentication

The Firebase Auth token is expected in property `socket.handshake.query.token`. It's checked for validity by decoding via npm module `firebase-admin`. If decoding is successful, the token is considered as valid and the uid is stored in the socket.client for further usage.

In addition to validity checking, there is some self-explanatory code round configuration issues such as if authentication and/or email verification are forced or not.

Full code of the so-called midleware function `verifyToken(..)`. For usage: see code in `./app/app.ts`.

Client-side handling of token transmission is described in [mysql-sync-client README.md](../../client/AngularMysqlSyncDemo/projects/mysql-sync-client/README.md).

```
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
```

### Data Manipulation Authorisation (security rules)

## Todo
