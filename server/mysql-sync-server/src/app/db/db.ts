import mysql = require('mysql');

import { IKeyValue, ITransferObject, IConditionClause } from 'mysql-sync-common';

export const createEntity = function (uid: string, data: ITransferObject, pool: mysql.Pool, callback: any) {
    // if authentication is turned on, store uid with every new record
    if (uid) {
        if (!data.attributes) {
            data.attributes = new Array<IKeyValue>();
        }
        data.attributes.push({
            key: 'creator',
            value: uid
        });
    }

    getConnection(pool, function (err, connection) {
        if (err) {
            console.error(err);
            callback(true, err);
        } else {
            checkCreate(uid, data.table, connection, function(err: boolean, result: any) {
                if (!err) {
                    if (result) {
                        var sqlQuery;
                        var sqlQuery1 = 'INSERT INTO ?? (';
                        var sqlQuery2 = ') VALUES (';
                        var sqlQuery3 = ')';

                        var inserts = [data.table];

                        for (let i = 0; data.attributes && i < data.attributes.length; i++) {
                            sqlQuery1 = sqlQuery1 + (i > 0 ? ',' : '') + data.attributes[i].key;
                            sqlQuery2 = sqlQuery2 + (i > 0 ? ',?' : '?');
                            inserts.push(data.attributes[i].value);
                        }

                        sqlQuery = mysql.format(sqlQuery1 + sqlQuery2 + sqlQuery3, inserts);

                        console.info('db.create with sql:', sqlQuery);

                        connection.query(sqlQuery, function (err, result) {
                            if (err) {
                                pool.releaseConnection(connection);
                                callback(true, err);
                            } else {
                                sqlQuery = "SELECT * FROM ?? WHERE ID = ?";
                                inserts = [data.table, result.insertId];
                                sqlQuery = mysql.format(sqlQuery, inserts);
                                connection.query(sqlQuery)
                                    .on('result', function (data) {
                                        console.log(data);
                                        callback(false, data);
                                    })
                            }
                        });
                    } else {
                        callback(true, 'user ' + uid + ' is not allowed to create entity of type ' + data.table);
                    }
                } else {
                    callback(true, result);
                }
            });
        }
    });
};

export const queryEntity = function (uid: string, data: ITransferObject, pool: mysql.Pool, callback: any) {
    getConnection(pool, function (err, connection) {
        if (err) {
            console.error(err);
            callback(true, err);
        } else {
            var resultArray = new Array();

            getReadQuery(uid, data, connection, function (err: boolean, result: any) {
                if (!err) {
                    var sqlQuery = result;

                    console.info('db.read with sql:', sqlQuery);

                    connection.query(sqlQuery)
                        .on('result', function (row) {
                            resultArray.push(row);
                        })
                        .on('end', function () {
                            callback(false, resultArray);
                        })
                } else {
                    callback (true, err);
                }
            });
        }
    });
};

export const updateEntity = function (uid: string, data: ITransferObject, pool: mysql.Pool, callback: any) {
    getConnection(pool, function (err, connection) {
        if (err) {
            console.error(err);
            callback(true, err);
        } else if (data.id) {
            checkVersion(data, connection, function(valid: boolean, msg: string) {
                if (valid) {
                    getUpdateQuery(uid, data, connection, function(err: boolean, result: any) {
                        if (!err) {
                            var sqlQuery = result;

                            console.info('db.update with sql:', sqlQuery);

                            connection.query(sqlQuery, function (err, _RESULT) {
                                if (err) {
                                    callback(true, err);
                                } else if (data.id) {
                                    sqlQuery = 'SELECT * FROM ?? WHERE ID = ?';
                                    var inserts = [data.table, data.id];
                                    sqlQuery = mysql.format(sqlQuery, inserts);
                                    connection.query(sqlQuery)
                                        .on('result', function (data) {
                                            callback(false, data);
                                        })
                                }
                            });
                        } else {
                            callback(true, result);
                        }
                    });
                } else {
                    callback(true, msg);
                }
            });
        }
    });
};

export const deleteEntity = async function (uid: string, data: ITransferObject, pool: mysql.Pool, callback: any) {
    getConnection(pool, function (err, connection) {
        if (err) {
            console.error(err);
            callback(true, err);
        } else if (data.id) {
            checkVersion(data, connection, function(valid: boolean, msg: string) {
                if (valid) {
                    getDeleteQuery(uid, data, connection, function (err: boolean, result: any) {
                        if (!err) {
                            var sqlQuery = result;

                            console.info('db.delete with sql:', sqlQuery);

                            connection.query(sqlQuery, function (err, _RESULT) {
                                if (err) {
                                    callback(true, err);
                                } else {
                                    callback(false, null);
                                }
                            });
                        } else {
                            callback(true, result);
                        }
                    });
                } else {
                    callback(true, msg);
                }
            });
        }
    });
};

const checkVersion = function(data: ITransferObject, connection: mysql.PoolConnection, callback: any) {
    if (data.id && data.version) {
        var sqlQuery = 'SELECT count(id) as no, version FROM ?? WHERE id=?';
        var inserts = [data.table, data.id];

        sqlQuery = mysql.format(sqlQuery, inserts);

        console.info('checkVersion:', sqlQuery);

        connection.query(sqlQuery).on('result', function (result) {
            if (result.no == 0) {
                return callback(false, 'checkVersion: object might habe been deleted. please refresh');
            } else if (new Date(data.version ? data.version : 0).getTime() < new Date(result.version).getTime()) {
                return callback(false, 'checkVersion: object is oudated. please refresh');
            } else {
                return callback(true, '');
            }
        });  
    } else {
        callback(false, 'checkVersion: either id or version are not set on TransferObject');
    }
}

const checkCreate = function(uid: string, table: string, connection: mysql.PoolConnection, callback: any) {
    getConstraintQuery('create', table, connection, function(err: boolean, result: any) {
        if (!err) {
            if (result && result.length > 0) {
                var sqlQuery = result;
                var inserts = [uid];

                sqlQuery = mysql.format(sqlQuery, inserts);

                console.info('checkCreate:', sqlQuery);

                connection.query(sqlQuery).on('result', function (_RESULT) {
                    console.info('checkCreate: checked access granted');
                    return callback(false, true);
                });

                console.info('checkCreate: access denied');
                callback(false, false);
            } else {
                console.warn('checkCreate: unchecked access granted - please provide a security rule');
                callback(false, true);
            }
        } else {
            callback(true, result);
        } 
    });
}

const getReadQuery = function(uid: string, data: ITransferObject, connection: mysql.PoolConnection, callback: any) {
    var sqlQuery = 'SELECT * FROM ??' + (data.condition ? ' WHERE ' : '');
    var inserts = [data.table];

    if (data.condition) {
      for (let i = 0; i < data.condition.length; i++) {
        const current = data.condition[i];
        
        sqlQuery = sqlQuery +
          (current.operator ? current.operator : '') +
          (current.startclause ? current.startclause : '') +
          '??' + current.comparator + '?' +
          (current.endclause ? current.endclause : '');
        
        inserts.push(current.key);
        inserts.push(current.value);
      }
    }

    getConstraintQuery('read', data.table, connection, function(err: boolean, result: any) {
        if (!err) {
            if (result && result.length > 0) {
                sqlQuery = sqlQuery + ((data.condition) ? ' AND' : ' WHERE') + ' id IN (SELECT * FROM (' + result + ')tblTmp)';
                inserts.push(uid);
            }
            callback(false, mysql.format(sqlQuery, inserts));
        } else {
            callback(true, result);
        } 
    });
}

const getUpdateQuery = function(uid: string, data: ITransferObject, connection: mysql.PoolConnection, callback: any) {
    if (data.id) {
        var sqlQuery = 'UPDATE ?? SET version=?';
        var inserts = [data.table, new Date()];

        for (let i = 0; data.attributes && i < data.attributes.length; i++) {
            // version cannot be updated manually
            if (data.attributes[i].key.toLowerCase() !== 'version') {
                sqlQuery = sqlQuery + ',' + data.attributes[i].key + '=?';
                inserts.push(data.attributes[i].value);
            }
        }
        sqlQuery = sqlQuery + 'WHERE id=?'
        inserts.push(data.id);

        getConstraintQuery('update', data.table, connection, function(err: boolean, result: any) {
            if (!err) {
                if (result && result.length > 0) {
                    sqlQuery = sqlQuery + ' AND id IN (SELECT * FROM(' + result + ')tblTmp)';
                    inserts.push(uid);
                }
                callback(false, mysql.format(sqlQuery, inserts));
            } else {
                callback(true, result);
            } 
        });
    } else {
        callback(true, 'data.id was not present but is mandatory for update statements');
    }
}

const getDeleteQuery = function(uid: string, data: ITransferObject, connection: mysql.PoolConnection, callback: any) {
    if (data.id) {
        var sqlQuery = 'DELETE FROM ?? WHERE id = ?';
        var inserts = [data.table, data.id];

        getConstraintQuery('delete', data.table, connection, function(err: boolean, result: any) {
            if (!err) {
                if (result && result.length > 0) {
                    sqlQuery = sqlQuery + ' AND id IN (SELECT * FROM (' + result + ')tblTmp)';
                    inserts.push(uid);
                }
                callback(false, mysql.format(sqlQuery, inserts));
            } else {
                callback(true, result);
            } 
        });
    } else {
        callback(true, 'data.id was not present but is mandatory for delete statements');
    }
}

const getConstraintQuery = function (method: string, table: string, connection: mysql.PoolConnection, callback: any) {
    var sqlQuery = 'SELECT ?? FROM rules WHERE `table` = ?';
    var inserts = [method, table];

    sqlQuery = mysql.format(sqlQuery, inserts);

    connection.query(sqlQuery).on('result', function (rule) {
        console.log(rule[method]);

        if (rule[method]) {
            return callback(false, rule[method]);
        }

        callback(false, '');
    });
}

const getConnection = function(pool: mysql.Pool, callback: (error: mysql.MysqlError, connection: mysql.PoolConnection) => void) {
    pool.getConnection(function(err, connection) {

        connection.on('error', function (err) {
            console.error('an sql connection error happened!', err);
            callback(err, connection);
        });

        callback(err, connection);

        releaseConnection(pool, connection);
    });
};

const releaseConnection = function (pool: mysql.Pool, connection: mysql.PoolConnection) {
    if (connection) {
        pool.releaseConnection(connection);
        console.info('successfully released db connection');
    }
}