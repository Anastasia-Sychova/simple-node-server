const mysql = require('mysql2');
const sha1 = require('sha1');
require('format-unicorn');

module.exports.connectToDb = function(config) {
    const connection = mysql.createConnection({
        host:     config.host,
        user:     config.user,
        password: config.password,
        database: config.database,
    });

    connection.connect();

    return connection;
};

module.exports.dbCreateUser = function(connection, data) {
    return new Promise (function(resolve, reject) {
        const query = "INSERT INTO `users`" +
            "(`email`, `first_name`, `last_name`, `password`)" +
            "VALUES ({email}, {first_name}, {last_name}, {password})".formatUnicorn({
                email:      mysql.escape(data.email),
                first_name: mysql.escape(data.first_name),
                last_name:  mysql.escape(data.last_name),
                password:   mysql.escape(sha1(data.password))
            });
        connection.query(query, function (err, results, fields) {
            if (err) {
                console.error('Query error:', err);
                reject('Internal error');
            }

            resolve(results);
        });
    }).then(function(result) {
        return result;
    });
};

module.exports.dbGetUser = function(connection, email, password) {
    return new Promise (function(resolve, reject) {
        let query = "SELECT `id`, `email`, `first_name`, `last_name` FROM `users`" +
            "WHERE `email`={email} AND `password`={passwordHash}".formatUnicorn({
                email:  mysql.escape(email),
                passwordHash:  mysql.escape(sha1(password))
        });
        connection.query(query, function (err, results, fields) {
            if (err) {
                console.error('Query error:', err);
                reject(err);
            }

            let result = results[0];
            resolve(result);
        });
    }).then(function(result) {
        return result;
    });
};

module.exports.dbIsUserExists = function(connection, email) {
    return new Promise (function(resolve, reject) {
        let query = "SELECT count(`id`) AS num_users FROM `users` WHERE `email`={email}".formatUnicorn({
                email:  mysql.escape(email)
            });
        connection.query(query, function (err, results, fields) {
            if (err) {
                console.error('Query error:', err);
                reject(err);
            }

            resolve(results[0]['num_users'] > 0);
        });
    }).then(function(result) {
        return result;
    });
};
