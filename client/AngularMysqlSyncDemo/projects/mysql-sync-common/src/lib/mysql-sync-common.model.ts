// create new lib: ng g library mysql-sync-common
//
// to build library run: ng build mysql-sync-common
// copy lib package from ./dist to ./node_modules of target project

export interface IDataObject {
  id: string;
  version: number;
}

export interface ITransferObject {
  table: string;
  id?: string;
  version?: number;
  condition?: string;
  attributes?: IKeyValue[];
  value?: IDataObject;
  values?: IDataObject[];
}

export interface IKeyValue {
  key: string;
  value: any;
}
