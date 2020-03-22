const dbFunctions = require('./db_functions.js');
const cacheFunctions = require('./cache_functions.js');

module.exports.registerUser = async function (dbConnection, cache,  requestBody) {
    const isUserExist = await dbFunctions.dbIsUserExists(dbConnection, requestBody.email, requestBody.password);
    if (isUserExist) {
        throw "User already exist";
    }
    const result = await dbFunctions.dbCreateUser(dbConnection, requestBody);
    const user = {
        id: result.insertId,
        first_name: requestBody.first_name,
        last_name: requestBody.last_name,
        email: requestBody.email,
    };

    const token = Math.random().toString(36).substr(2);
    await cacheFunctions.setCacheValue(cache, `authToken:${token}`, JSON.stringify(user), 7200);

    return {
        token: token,
        user
    };
};

module.exports.loginUser = async function (dbConnection, cache,  email, password) {
    const user = await dbFunctions.dbGetUser(dbConnection, email, password);
    if (!user) {
        throw 'User not found';
    }
    const token = Math.random().toString(36).substr(2);
    await cacheFunctions.setCacheValue(cache, `authToken:${token}`, JSON.stringify(user), 7200);

    return {
        token: token,
        user
    };
};

module.exports.getStatus = async function (cache,  token) {
    try {
        const user = await cacheFunctions.getCacheValue(cache, `authToken:${token}`);

        return {
            token: token,
            user: JSON.parse(user)
        };
    } catch (e) {
        return {
            token: token,
            user: {
                id: 0,
                first_name: null,
                last_name: null,
                email: null,
            }
        };
    }
};

module.exports.logoutUser = async function (cache, token) {
    await cacheFunctions.deleteCacheValue(cache, `authToken:${token}`);
}
