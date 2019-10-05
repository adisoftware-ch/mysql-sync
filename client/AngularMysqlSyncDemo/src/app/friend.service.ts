import { Observable} from 'rxjs';

import { MysqlSyncClientService, IDataObject } from 'mysql-sync-client';

// @todo:
// Firebase Authentication Token zur Server-seitigen Authentifizierung mitgeben.
// Server-seitige Authentifizierung umsetzen

export interface IFriend extends IDataObject {
  name: string;
}

export class FriendService {

  constructor(private db: MysqlSyncClientService) {}

  public setAuthToken(token: string) {
    this.db.setAuthToken(token);
  }

  public getUsersConnected(): Observable<number> {
    return this.db.getUsersConnected();
  }

  public getErrorMessages(): Observable<any> {
    return this.db.getErrorMessages();
  }

  // ---
  // CRUD
  // ---

  public addFriend(name: string) {
    this.db.create('friend', {
      name
    });
  }

  public deleteFriend(id: string) {
    this.db.delete('friend', id);
  }

  public readFriends(conditionclause: string): Observable<IFriend[]> {
    return this.db.read('friend', conditionclause) as Observable<IFriend[]>;
  }

  public updateFriend(id: string, name: string) {
    this.db.update('friend', id, {
      name
    });
  }
}
