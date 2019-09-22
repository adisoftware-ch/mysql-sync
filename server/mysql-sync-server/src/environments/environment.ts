import fs = require('fs');

export interface IConfig {
    server_port: number;
    maxSocketListeners: number;
    secure: boolean;
    secureconfig: {
        key: string;
        cert: string;
        passphrase: string;
    };
    mysql : {
        connectionLimit: number;
        host: string;
        user: string;
        password: string;
        database: string;
    };
    firebaseAuth: {
        forceAuth: boolean;
        emailVerification: boolean,
        firebase: {
            apiKey: string,
            authDomain: string,
            databaseURL: string,
            projectId: string,
            storageBucket: string,
            messagingSenderId: string,
            appId: string
        }
    }
}

export const environment = (): IConfig => {
    try {
        console.log(process.cwd());
        let buffer = fs.readFileSync(`./src/assets/config.${process.env.NODE_ENV}.json`);

        try {
            return JSON.parse(buffer.toString());
        } catch(err) {
            console.log('Error parsing config:', err);
            throw err;
        }
    } catch(err) {
        console.log(`Error reading config from ./src/assets/config.${process.env.NODE_ENV}.json:`, err);
        throw err;
    }
}
