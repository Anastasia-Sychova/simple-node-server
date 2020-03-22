const redis = require('redis');

module.exports.cacheSetup = function(config) {
    return new Promise((resolve, reject) => {
        const client = redis.createClient(config.port, config.host);

        client.on("connect", async function () {
            console.log("Cache connected");

            resolve(client);
        });

        client.on("error", function (err) {
            console.log('Cache error', err);
            client.quit();
            reject('Cache error');
        });

        client.on("httpError", function (err) {
            console.log('Cache httpError', err);
            client.quit();
            reject('Cache error');
        });

        client.on('end', () => {
            console.log('Connection closed.');
            resolve('Connection closed.');
        });
    }).then(function(result) {
        return result;
    });
};

module.exports.getCacheValue = function(client, key) {
    return new Promise((resolve, reject) => {
        client.get(key, (err, result) => {
            if (err) {
                reject(err)
            }
            if (result === null) {
                reject('Value not found');
            }

            resolve(result);
        });
    }).then(function(result) {
        return result;
    });
};

module.exports.setCacheValue = function(client, key, value, time) {
    return new Promise((resolve, reject) => {
        client.set(key, value, 'EX', time, (err, result) => {
            if (err) {
                console.error(err);
                reject(err)
            }

            resolve(result);
        });
    }).then(function(result) {
        return result;
    });
};

module.exports.deleteCacheValue = function(client, key) {
    return new Promise((resolve, reject) => {
        client.del(key, (err, result) => {
            if (err) {
                console.error(err);
                reject(err)
            }

            resolve(result);
        });
    }).then(function(result) {
        return result;
    });
};
