"use strict";

var request = require("request");
var url = require("url");
var q = require("q");
var PREFIX = "/_matrix/appservice/v1";

module.exports.setRoutes = function(app) {
    app.get("/users/:userId", function(req, res) {
        res.send("user not implemented " + req.params.userId);
    });

    app.get("/rooms/:alias", function(req, res) {
        res.send("alias not implemented " + req.params.alias);
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
    request.post(endpoint, {json: body}, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
            console.log(response);
        };
    });
};