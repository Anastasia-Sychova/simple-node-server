'use strict';

const express = require('express');
const cacheFunctions = require('./cache_functions.js');
const dbFunctions = require('./db_functions.js');
const authFunctions = require('./auth_functions.js');
const yaml = require('js-yaml');
const fs = require('fs');

const config = yaml.safeLoad(fs.readFileSync('config/config.yml', 'utf8'));

let cache = {};
cacheFunctions.cacheSetup(config.parameters.redis).then((client) => {
    cache = client;
});

const dbConnection = dbFunctions.connectToDb(config.parameters.db);

const validator = require('tv4');
const loginSchema = require('./../schema/login_schema.json');
const registerSchema = require('./../schema/register_schema.json');

const port = 2222;
const host = '127.0.0.1';


const app = express();
app.use(express.json());

app.get('/me/status', (req, res) => {
    let token = req.get('Token');
    authFunctions.getStatus(cache, token).then(
        (result) => {
            res.send(result);
        }
    )
});

app.post('/me/login', (req, res) => {
    let errors = validateRequest(req.body, loginSchema);
    if (errors.length > 0) {
        res.status(400).send(errors);

        return;
    }

    authFunctions.loginUser(dbConnection, cache,req.body.email, req.body.password).then(
        (result) => {
            res.send(result);
        },
        (error) => {
            if ('User not found' === error) {
                res.status(404).send(error);
            }
            res.status(500).send('Something went wrong');
        });
});

app.post('/me/register', (req, res) => {
    let errors = validateRequest(req.body, registerSchema);
    if (errors.length > 0) {
        res.status(400).send(errors);

        return;
    }

    authFunctions.registerUser(dbConnection, cache, req.body).then(
        (result) => {
            res.status(201).send(result);
        },
        (error) => {
            if ('User already exist' === error) {
                res.status(400).send(error);
            }
            res.status(500).send('Something went wrong');
        }
    )
});

app.get('/me/logout', (req, res) => {
    let token = req.get('Token');
    authFunctions.logoutUser(cache, token).then(
        (result) => {
            res.status(204).send();
        }
    )
});

app.listen(port, host);
console.log(`running on http://${host}:${port}`);

function validateRequest(body, schema) {
    const validation = validator.validateMultiple(body, schema);
    const errors = [];
    if (!validation.valid) {
        validation.errors.forEach((error) => {
            errors.push(`${error} at ${error.dataPath}`);
        });
    }

    return errors;
}
