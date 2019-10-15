# AngularMysqlSyncDemo

  * [Intention](#intention)
  * [Building and Running the Application](#building-and-running-the-application)
  * [Running tests](#running-tests)
  * [Implementation Details](#implementation-details)
    + [Usage of Database operations](#usage-of-database-operations)
      - [Some examples (Extracts from friend.service.ts)](#some-examples--extracts-from-friendservicets-)
    + [User Authentication](#user-authentication)
      - [Server side](#server-side)
      - [Client side](#client-side)
  * [Todo](#todo)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>

## Intention

AngularNG demo application for usage of mysql-sync. Besides the demo, this project is intended for providing the required npm libraries [mysql-sync-client](./projects/mysql-sync-client/README.md) and [mysql-sync-common](./projects/mysql-sync-common/README.md). In future, it will additionally be extended for integration testing of mysql-sync.

## Building and Running the Application

See [mysql-sync](../../README.md) for building and running mysql-sync

## Running tests

Currently just the autmatically generated tests are available for the demo application.

- Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).
- Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Implementation Details

### Usage of Database operations

Usage of database operations is straight forward. All complexity is encapsulated by the library `mysql-sync-client`. See `friend.service.ts` for further details.

#### Some examples (Extracts from friend.service.ts)

As described in [mysql-sync-client](./projects/mysql-sync-client/README.md), the `read` operation returns an Obserable covering all changes on the selected range of objects. So, this Observable is returned to the component, which will register on it and update the friends-view accordingly.

```
public readFriends(condition: IConditionClause[]): Observable<IFriend[]> {
    return this.db.read('friend', condition) as Observable<IFriend[]>;
}
```

The other operations are silent. `mysql-sync-client` will automatically adjust the already registered Observable, if there are changes on contained objects.

**Handling of conflicting operations:** For `delete` and `update`, the actual version of the object has to be passed with the calls. `mysql-sync-server` will check them against current version of the objects in database. The operations are only possible, if the version number matches.

Example:

```
public deleteFriend(id: string, version: number) {
    this.db.delete('friend', id, version);
}
```

If something goes wrong, mysql-sync-client will present the error messages in form of an additional observable, that can be registered. In our demo app, we access it via friend.service.ts:

```
public getErrorMessages(): Observable<any> {
    return this.db.getErrorMessages();
}
```

### User Authentication

#### Server side

Our demo app uses Google Firebase for user Authentication. Registration, Login and Logout are handled by `auth.service.ts`. See code for details. I don't want to go deeper, here. There are many tutorials available on how to handel Firebase Authentication.

What's special to our case is the usage of the observable `idTocken`: It's the token, we use for authentication. Our app has to listen on for changes in authentication state. If a change happens, we have to pass the new token (or null, if logged out) to the server.

For that case, AuthService stores it as a class variable. By starting up the client, we listen to changes in AppComponent (`app.component.ts`). On change, we pass the new token to our server.

```
export class AuthService {
  user: Observable<firebase.User>;
  token: Observable<string>;

  constructor(private firebaseAuth: AngularFireAuth) {
    this.user = firebaseAuth.authState;
    this.token = firebaseAuth.idToken;
  }
  ...
```

```
export class AppComponent implements OnInit {

  ...

  constructor(public authService: AuthService, private friendService: FriendService) {}

  ngOnInit() {
    // connect socket client, if authentication token changes
    this.authService.token.subscribe(token => {
      this.friendService.setAuthToken(token);
      ...
    }
    ...
```

#### Client side

AngularMysqlSyncDemo additionally implements some client side authentication checking. 

**Note:** Client side checking is just for providing better usability to the user. It prevents the ordinary user from running into navigation errors. **Client side authentication checking never protects against hackers which make direct use of the servers interface**. Therefore, the app is only secured, if the chapter on server-side authentication ckecking is implemented.

Client side checking is implemented by usage of a so called Guard (`auth.guard.ts`). It has one single method, that provides the check (simplified):

```
canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authService.user) {
        // logged in, so return true
        return true;
    }
    // not logged in
    return false;
}
```
(Additional checks like 'is the EMail verified, ...' could be done, here).

The guard is used in the applications routes as follows (`app-routing.module.ts`):

```
const routes: Routes = [
    { path: '', redirectTo: 'friends', pathMatch: 'full' },                                 -> open for public
    { path: 'detail/:id', component: FriendDetailComponent, **canActivate: [AuthGuard]** }, -> just open, if logged in
    { path: 'friends', component: FriendsComponent, **canActivate: [AuthGuard]** },         -> just open, if logged in
    { path: 'login', component: LoginComponent }                                            -> open for public
];
```

## Todo

- [ ] Add unit- and integration tests
