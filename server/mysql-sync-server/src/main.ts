// to start server: 
// mysql.server start
// npm run [dev | prod]

import { environment } from './environments/environment';

import * as mysqlSyncServer from './app/app';

async function main() {
    console.log('starting MysqlSyncServer...');

    mysqlSyncServer.start(environment().server_port).then(() => {
        console.log(`Server started at http://localhost:${environment().server_port}`);
    });
}

main().catch(error => console.error(error));