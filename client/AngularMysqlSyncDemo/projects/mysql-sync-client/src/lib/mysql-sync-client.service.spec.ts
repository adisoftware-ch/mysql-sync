import { TestBed } from '@angular/core/testing';

import { MysqlSyncClientService } from './mysql-sync-client.service';

describe('MysqlSyncClientService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MysqlSyncClientService = TestBed.get(MysqlSyncClientService);
    expect(service).toBeTruthy();
  });
});
