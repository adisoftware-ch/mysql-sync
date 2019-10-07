## Intention

websocket server that provides a realtime, NoSQL-like API to your MySQL database.

Many web applications are still based on MySQL database. mysql-sync enables to keep on using MySQL while benefitting from realtime functionality such as notification on data updates between different clients.

For CRUD data manipulation, mysql-sync-server offers a simple NoSQL-like API. This includes checking authorisation against (very simple) security rules that can be configured inside the MySQL database.

Furthermore, mysql-sync-server offers the possiblity to use Firebase Auth tokens for user authentication. 

By cloning the project, you can easyli extend the CRUD API as well as the security rules concept (authorisation) or adapt for other authentication token providers than Google Firebase. See the specific sections for implementation details.

## Building and Running the Server

See [mysql-sync](../../README.md) for building and running mysql-sync

## Implementation Details

### The Server Application

### CRUD API (over websocket)

### Firebase Authentication

### Data Manipulation Authorisation (security rules)

## Todo
