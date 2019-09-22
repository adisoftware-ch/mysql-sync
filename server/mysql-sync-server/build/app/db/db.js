"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEntity = function (data, mysql, pool, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(err);
            if (connection) {
                connection.release();
            }
            return callback(true, err);
        }
        else {
            var sqlQuery;
            var sqlQuery1 = 'INSERT INTO ?? (';
            var sqlQuery2 = ') VALUES (';
            var sqlQuery3 = ')';
            var inserts = [data.table];
            for (var i = 0; data.attributes && i < data.attributes.length; i++) {
                sqlQuery1 = sqlQuery1 + (i > 0 ? ',' : '') + data.attributes[i].key;
                sqlQuery2 = sqlQuery2 + (i > 0 ? ',?' : '?');
                inserts.push(data.attributes[i].value);
            }
            sqlQuery = mysql.format(sqlQuery1 + sqlQuery2 + sqlQuery3, inserts);
            connection.query(sqlQuery, function (err, result) {
                if (err) {
                    return callback(true, null);
                }
                else {
                    sqlQuery = "SELECT * FROM ?? WHERE ID = ?";
                    inserts = [data.table, result.insertId];
                    sqlQuery = mysql.format(sqlQuery, inserts);
                    connection.query(sqlQuery)
                        .on('result', function (data) {
                        console.log(data);
                        callback(false, data);
                    });
                }
            });
        }
        connection.on('error', function (err) {
            return callback(true, null);
        });
        connection.release();
    });
};
exports.updateEntity = function (data, mysql, pool, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(err);
            if (connection) {
                connection.release();
            }
            return callback(true, err);
        }
        else if (data.id) {
            var sqlQuery = 'UPDATE ?? SET ';
            var inserts = [data.table];
            for (var i = 0; data.attributes && i < data.attributes.length; i++) {
                sqlQuery = sqlQuery + (i > 0 ? ',' : '') + data.attributes[i].key + '=?';
                inserts.push(data.attributes[i].value);
            }
            sqlQuery = sqlQuery + 'WHERE id=?';
            inserts.push(data.id);
            sqlQuery = mysql.format(sqlQuery, inserts);
            connection.query(sqlQuery, function (err, result) {
                if (err) {
                    return callback(true, null);
                }
                else if (data.id) {
                    sqlQuery = "SELECT * FROM ?? WHERE ID = ?";
                    inserts = [data.table, data.id];
                    sqlQuery = mysql.format(sqlQuery, inserts);
                    connection.query(sqlQuery)
                        .on('result', function (data) {
                        callback(false, data);
                    });
                }
            });
        }
        connection.on('error', function (err) {
            return callback(true, null);
        });
        connection.release();
    });
};
exports.queryEntity = function (data, mysql, pool, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(err);
            if (connection) {
                connection.release();
            }
            return callback(true, err);
        }
        else {
            var result = new Array();
            var sqlQuery = 'SELECT * FROM ??' + (data.condition ? 'WHERE ' + data.condition : '');
            var inserts = [data.table];
            sqlQuery = mysql.format(sqlQuery, inserts);
            connection.query(sqlQuery)
                .on('result', function (row) {
                result.push(row);
            })
                .on('end', function () {
                callback(false, result);
            });
        }
        connection.on('error', function (err) {
            return callback(true, err);
        });
        connection.release();
    });
};
exports.deleteEntity = function (data, mysql, pool, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(err);
            if (connection) {
                connection.release();
            }
            return callback(true, err);
        }
        else {
            var sqlQuery = 'DELETE FROM ?? WHERE id = ?';
            var inserts = [data.table, data.id];
            sqlQuery = mysql.format(sqlQuery, inserts);
            connection.query(sqlQuery, function (err, result) {
                if (err) {
                    return callback(true, null);
                }
                else {
                    return callback(false, null);
                }
            });
        }
        connection.on('error', function (err) {
            return callback(true, null);
        });
        connection.release();
    });
};
