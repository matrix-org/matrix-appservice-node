"use strict";

var request = require("request");
var url = require("url");
var q = require("q");
var events = require("events");

var PREFIX = "/_matrix/appservice/v1";

var queryResolvers = {
    user: {
    //   resolverName: fn
    },
    alias: {
    //   resolverName: fn    
    }
};

var askHandlers = function(resolvers, param) {
    var promises = [];
    Object.keys(resolvers).forEach(function(key) {
        promises.push(resolvers[key](param));
    })
    return q.all(promises);
};

module.exports.setRoutes = function(app) {
    app.get("/users/:userId", function(req, res) {
        var promise = askHandlers(queryResolvers.user, req.params.userId);
        promise.then(function() {
            res.send("OK");
        },
        function(err) {
            res.send("NOK");
        });
    });

    app.get("/rooms/:alias", function(req, res) {
        var promise = askHandlers(queryResolvers.alias, req.params.alias);
        promise.then(function() {
            res.send("OK");
        },
        function(err) {
            res.send("NOK");
        });
    });

    app.put("/transactions/:txnId", function(req, res) {
        res.send("txn not implemented " + req.params.txnId);
    });
};

module.exports.register = function(hsUrl, asUrl, asToken, namespaces, cb) {
    // POST /register
    // { url: "string", as_token: "string", "namespaces": Object }
    var endpoint = url.resolve(hsUrl, PREFIX + "/register");
    var body = {
        url: asUrl,
        as_token: asToken,
        namespaces: namespaces
    };
    var defer = q.defer();
    request.post(endpoint, {json: body}, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            defer.resolve(body.hs_token);
        }
        else {
            defer.reject(body ? body : error);
        }
    });
    return defer.promise;
};

module.exports.unregister = function(hsUrl, asToken) {
    // POST /unregister
    // { as_token: "string"}
    var endpoint = url.resolve(hsUrl, PREFIX + "/unregister");
    var body = {
        as_token: asToken
    };
    var defer = q.defer();
    request.post(endpoint, {json: body}, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            defer.resolve(response);
        }
        else {
            defer.reject(body ? body : error);
        }
    });
    return defer.promise;
};

module.exports.addQueryHandler = function(opts, fn) {
    var check = function(opts, key, keyType) {
        if (!opts[key]) {
            console.error("addQueryHandler: opts must supply a '%s'", key);
            return false;
        }
        if (keyType && typeof opts[key] != keyType) {
            console.error("addQueryHandler: %s must be a %s", key, keyType);
            return false;
        }
        return true;
    };

    if (!check(opts, "name", "string") || !check(opts, "type", "string")) {
        return;
    }

    if (["user", "alias"].indexOf(opts["type"]) == -1) {
        console.error("'type' must be 'user' or 'alias'");
        return;
    }
    queryResolvers[opts["type"]][opts["name"]] = fn;
};