// create new lib: ng g library mysql-sync-client
//
// to build library run: ng build mysql-sync-client
// copy lib package from ./dist to ./node_modules of target project

import { Injectable, Inject } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';

// npm i socket.io-client
// npm i @types/socket.io-client

import * as io from 'socket.io-client';

export const MYSQL_SYNC_ENV = 'MYSQL_SYNC_ENV';

export interface IMySqlSyncConfig {
  dataProvider: {
    requireAuthToken: boolean;
    secure: boolean;
    socketurl: string;
    secureconfig?: {
      ca: string;
      secure: boolean;
      rejectUnauthorized: boolean;
      agent: boolean;
    }
  };
}

export interface IDataObject {
  id: string;
  version: string;
}

export interface ITransferObject {
  table: string;
  id?: string;
  condition?: string;
  attributes?: IKeyValue[];
  value?: IDataObject;
  values?: IDataObject[];
}

export interface IKeyValue {
  key: string;
  value: any;
}

@Injectable({
  providedIn: 'root'
})
export class MysqlSyncClientService {

  private socket: SocketIOClient.Socket;

  private objectMap: Map<string, Array<IDataObject>>;

  private observableMap: Map<string, Observable<IDataObject[]>>;

  private usersConnected: BehaviorSubject<number>;

  private usersConnectedObservable: Observable<number>;

  private error: BehaviorSubject<any>;

  private errorObservable: Observable<any>;

  private dataProvider: IMySqlSyncConfig['dataProvider'];

  constructor(@Inject(MYSQL_SYNC_ENV) environment: IMySqlSyncConfig) {

    this.objectMap = new Map<string, Array<IDataObject>>();
    this.observableMap = new Map<string, Observable<IDataObject[]>>();

    this.usersConnected = new BehaviorSubject(0);
    this.usersConnectedObservable = this.usersConnected.asObservable();

    this.error = new BehaviorSubject('');
    this.errorObservable = this.error.asObservable();

    this.dataProvider = environment.dataProvider;

    this.connect();
  }

  public setAuthToken(token: string) {
    console.log('setting AuthToken:', token);

    const config: any = this.dataProvider;
    config.secureconfig.query = { token };

    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }

    this.connect(config.secureconfig);
  }

  public getUsersConnected(): Observable<number> {
    return this.usersConnectedObservable;
  }

  public getErrorMessages(): Observable<any> {
    return this.errorObservable;
  }

  // ---
  // PRIVATE HELPER
  // ---

  private connect(config?: any) {
    if (!this.dataProvider.requireAuthToken || (config && config.query)) {
      if (this.dataProvider.secure) {
        fetch(this.dataProvider.secureconfig.ca).then(result => {
          result.text().then(cert => {
            console.log('certificate found: ' + cert);

            // replace cert path with real content of cert
            this.dataProvider.secureconfig.ca = cert;

            // connect using wss protocol
            this.socket = io.connect(this.dataProvider.socketurl, config ? config : this.dataProvider.secureconfig);
            this.listen();
          });
        });
      } else {
        console.log('connecting with config:', config);
        // connect using ws protocol
        this.socket = io.connect(this.dataProvider.socketurl, config ? config : null);
        this.listen();
      }
    } else {
      console.warn('no connection established. please provide a valid auth token.');
    }
  }

  private listen(): void {
    // init database connection with config from `environment`
    this.socket.emit('init');

    this.socket.on('read:response', (msg: ITransferObject) => {
      console.log(`receiving ${msg.table} listing`, msg);
      const objects = this.getObjectArray(msg);

      objects.splice(0, objects.length);

      // process listing
      msg.values.forEach(next => {
        objects.push(next);
      });
    });

    this.socket.on('create:response', (msg: ITransferObject) => {
      console.log(`receiving new ${msg.table} created`);

      // alle via read gelesene calls aktualisieren.
      // wir wissen nicht, welche conditions das neu erstellte element enthalten.
      this.objectMap.forEach((_VALUE, key) => {
        const index = key.indexOf(':');
        const condition = key.substring(index + 1);

        this.read(msg.table, condition === 'null' ? null : condition);
      });
    });

    this.socket.on('update:response', (msg: ITransferObject) => {
      console.log(`receiving new ${msg.table} update`);

      // es muss in allen vorhandenen ObjectArray nach Vorhandensein der ID gesucht & aktualisiert werden
      this.objectMap.forEach((objects, _KEY) => {
        const index = objects.findIndex(obj => obj.id === msg.value.id);
        if (index >= 0) {
          objects.splice(index, 1);
        }
        objects.push(msg.value);
      });
    });

    this.socket.on('delete:response', (msg: ITransferObject) => {
      console.log(`receiving new ${msg.table} deletion confirmation`);

      // es muss in allen vorhandenen ObjectArray nach Vorhandensein der ID gesucht & gelöscht werden
      this.objectMap.forEach((objects, _KEY) => {
        const index = objects.findIndex(obj => obj.id === msg.value.id);
        if (index >= 0) {
          objects.splice(index, 1);
        }
      });
    });

    this.socket.on('sockets:connected', (msg: number) => {
      console.log(`receiving update on users connected: ${msg}`);

      this.usersConnected.next(msg);
    });

    this.socket.on('error', (msg: any) => {
      console.log(`receiving error message from server: ${msg}`);

      this.error.next(msg);
    });
  }

  private getObjectArray(msg: ITransferObject): Array<IDataObject> {
    const key = msg.table + ':' + msg.condition;
    let objects = this.objectMap.get(key);

    // create new observable, if not yet contained
    if (!objects) {
      objects = new Array<any>();
      this.objectMap.set(key, objects);
      this.observableMap.set(key, of(objects));
    }

    return objects;
  }

  private getObservable(msg: ITransferObject): Observable<IDataObject[]> {
    const key = msg.table + ':' + msg.condition;
    let observable = this.observableMap.get(key);

    if (!observable) {
      let objects = this.objectMap.get(key);

      if (!objects) {
        objects = new Array<any>();
        this.objectMap.set(key, objects);
      }

      observable = of(objects);
      this.observableMap.set(key, observable);
    }

    return observable;
  }

  private transformObjectToKVP(object: any): IKeyValue[] {
    const kvp = new Array<IKeyValue>();
    Object.keys(object).forEach(key => {
      kvp.push({key, value: object[key]});
    });
    return kvp;
  }

  // ---
  // CRUD
  // ---

  public create(table: string, entity: any) {
    if (this.socket && this.socket.connected) {
      console.log(`sending create ${table}`);

      this.socket.emit('create', {
        table,
        attributes : this.transformObjectToKVP(entity)
      });
    } else {
      console.warn('connection to mysql-sync server is not established. call to create not possibe! entity:', entity);
    }
  }

  public delete(table: string, id: string) {
    if (this.socket && this.socket.connected) {
      console.log(`sending delete from ${table} with id = ${id}`);

      this.socket.emit('delete', {
        table,
        id
      });
    } else {
      console.warn('connection to mysql-sync server is not established. call to delete not possibe! table:', table + ', id: ' + id);
    }
  }

  public read(table: string, conditionclause: string): Observable<IDataObject[]> {
    const msg = {
      table,
      condition: conditionclause
    };

    if (this.socket && this.socket.connected) {
      console.log(`sending read from ${msg.table} where ${msg.condition}`);

      this.socket.emit('read', msg);

    } else {
      console.warn('connection to mysql-sync server is not established. call to read not possibe! table:',
        msg.table + ', condition: ' + msg.condition);
    }

    // populate observable with short delay to give the database time for responding
    return this.getObservable(msg).pipe(delay(100));
  }

  public update(table: string, id: string, entity: any) {
    if (this.socket && this.socket.connected) {
      console.log(`sending update to ${table} with id = ${id}`);

      this.socket.emit('update', {
        table,
        id,
        attributes : this.transformObjectToKVP(entity)
      });
    } else {
      console.warn('connection to mysql-sync server is not established. call to update not possibe! entity:', entity);
    }
  }
}
