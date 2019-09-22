import mysql = require('mysql');

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

export const createEntity = function(data: ITransferObject, mysql: any, pool: mysql.Pool, callback: any) {
    pool.getConnection(function(err,connection){
        if (err) {
            console.error(err);
            if (connection) {
                connection.release();
            }
            return callback(true,err);
        } else {
            var sqlQuery;
            var sqlQuery1 = 'INSERT INTO ?? (';
            var sqlQuery2 = ') VALUES (';
            var sqlQuery3 = ')';

            var inserts =[data.table];

            for (let i=0; data.attributes && i<data.attributes.length; i++) {
                sqlQuery1 =  sqlQuery1 + (i > 0 ? ',' : '') + data.attributes[i].key;
                sqlQuery2 =  sqlQuery2 + (i > 0 ? ',?' : '?');
                inserts.push(data.attributes[i].value);
            }

            sqlQuery = mysql.format(sqlQuery1 + sqlQuery2 + sqlQuery3, inserts);

            connection.query(sqlQuery, function(err, result) {  
                if (err) {
                    return callback(true,null);
                } else {
                    sqlQuery = "SELECT * FROM ?? WHERE ID = ?";
                    inserts = [data.table, result.insertId];
                    sqlQuery = mysql.format(sqlQuery,inserts);
                    connection.query(sqlQuery)
                        .on('result', function(data){
                            console.log(data);
                            callback(false, data);
                        })
                }
            });
        }
        connection.on('error', function(err) {
            return callback(true,null);
        });
        connection.release();
    });
};

export const updateEntity = function(uid: string, data: ITransferObject, mysql: any, pool: mysql.Pool, callback: any) {
    pool.getConnection(function(err,connection){
        if (err) {
            console.error(err);
            if (connection) {
                connection.release();
            }
            return callback(true,err);
        } else if (data.id) {
            checkRules(data.id, uid, data.table, 'update', mysql, pool, function(err: boolean, valid: boolean) {
                if (err) {
                    connection.release();
                    return callback(true,null);
                } else if (valid && data.id) {
                    var sqlQuery = 'UPDATE ?? SET ';
                    var inserts =[data.table];

                    for (let i=0; data.attributes && i<data.attributes.length; i++) {
                        sqlQuery =  sqlQuery + (i > 0 ? ',' : '') + data.attributes[i].key + '=?';
                        inserts.push(data.attributes[i].value);
                    }
                    sqlQuery = sqlQuery + 'WHERE id=?'
                    inserts.push(data.id);
                    
                    sqlQuery = mysql.format(sqlQuery,inserts);

                    connection.query(sqlQuery, function(err, result) {  
                        if (err) {
                            connection.release();
                            return callback(true,null);
                        } else if (data.id) {
                            sqlQuery = "SELECT * FROM ?? WHERE ID = ?";
                            inserts = [data.table, data.id];
                            sqlQuery = mysql.format(sqlQuery,inserts);
                            connection.query(sqlQuery)
                                .on('result', function(data){
                                    connection.release();
                                    return callback(false, data);
                                })
                        }
                    });
                }
            });
        }
        connection.on('error', function(err) {
            connection.release();
            return callback(true,null);
        });
    });
};

export const queryEntity = function(data: ITransferObject, mysql: any, pool: mysql.Pool, callback: any) {
    pool.getConnection(async function(err,connection){
        if (err) {
            console.error(err);
            if (connection) {
                connection.release();
            }
            return callback(true,err);
        } else {
            var result = new Array();

            var sqlQuery = 'SELECT * FROM ??' + (data.condition ? ' WHERE ' + data.condition : '');
            var inserts = [data.table];

            sqlQuery = mysql.format(sqlQuery,inserts);

            console.log(sqlQuery);

            connection.query(sqlQuery)
                .on('result', function(row) {
                        result.push(row)
                })
                .on('end', function() {
                    callback(false, result);
                })
        }
        connection.on('error', function(err) {
            return callback(true, err);
        });
        connection.release();
    });
};

export const deleteEntity = async function(uid: string, data: ITransferObject, mysql: any, pool: mysql.Pool, callback: any) {
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(err);
            if (connection) {
                connection.release();
            }
            return callback(true,err);
        } else if (data.id) {
            checkRules(data.id, uid, data.table, 'delete', mysql, pool, function(err: boolean, valid: boolean) {
                if (err) {
                    connection.release();
                    return callback(true,null);
                } else if (valid && data.id) {
                    var sqlQuery = 'DELETE FROM ?? WHERE id = ?';
                    var inserts =[data.table, data.id];
                    sqlQuery = mysql.format(sqlQuery,inserts);

                    connection.query(sqlQuery, function(err, result) {  
                        connection.release();
                        if (err) {
                            return callback(true, null);
                        } else {
                            return callback(false, null);
                        }
                    });
                }
            });
        }
        connection.on('error', function(err) {
            connection.release();
            return callback(true,null);
        });
    });
};

const checkRules = function(id: string, uid: string, table: string, method: string, mysql: any, pool: mysql.Pool, callback: any) {
    if (uid) {
        pool.getConnection(function(err,connection){
            if (err) {
                console.error('db.checkRules:', err);
                if (connection) {
                    connection.release();
                }
                return callback(true, false);
            } else {
                var sqlQuery = 'SELECT ?? FROM rules WHERE `table` = ?';
                var inserts = [method, table];

                sqlQuery = mysql.format(sqlQuery,inserts);

                connection.query(sqlQuery).on('result', function(rule) {
                    console.log(rule);

                    inserts = [id, uid];
                    sqlQuery = mysql.format(rule[method],inserts);

                    connection.query(sqlQuery).on('result', function(data) {
                        connection.release();
                        return callback(false, data != null);
                    });
                });
            }
            connection.on('error', function(err) {
                console.error('db.checkRules:', err);
                if (connection)
                    connection.release();
                return callback(true, false);
            });
        });
    } else {
        return callback(false, true);
    }
}