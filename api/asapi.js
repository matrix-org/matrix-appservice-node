/* Application Service API
 * This file contains the raw HTTP calls for the AS API. This includes inbound
 * and outbound calls. The general structure for outbound calls involves calling
 * a function which will return a Q promise, which will be resolved when the
 * HTTP call finishes. The general structure for inbound calls is more complex.
 * This module will invoke an AsapiRequestHandler to handle the incoming
 * request. This request handler is expected to return a promise, which will be
 * resolved when the request has been processed.
 */

"use strict";

var request = require("request");
var url = require("url");
var q = require("q");

var PREFIX = "/_matrix/appservice/v1";

function AsapiRequestHandler() {

    /* 
     * Handle an incoming User Query request.
     * @param {String} userId The user being queried.
     * @return {Promise} A promise which is resolved if the user exists, or 
     * rejected if the user does not exist.
     */
    this.user = function(userId) {
        return q({});
    };

    /* 
     * Handle an incoming Room Alias Query request.
     * @param {String} roomAlias The alias being queried.
     * @return {Promise} A promise which is resolved if the alias exists, 
     * or rejected if the alias does not exist.
     */
    this.alias = function(roomAlias) {
        return q({});
    };

    /*
     * Handle a set of incoming events.
     * @param {Array<Event>} events a list of incoming events.
     * @param {String} txnId The transaction ID for this set of events.
     * @param {String} hsToken The home server access token.
     */
    this.transaction = function(events, txnId, hsToken) {
        return q({});
    };
};
module.exports.AsapiRequestHandler = AsapiRequestHandler;

/*
 * Set the routes for the AS API to the specified app.
 * @param app The express app to hook into.
 * @param {AsapiRequestHandler} asapiRequestHandler The handler which can 
 * process incoming requests.
 */
module.exports.setRoutes = function(app, asapiRequestHandler) {
    app.get("/users/:userId", function(req, res) {
        asapiRequestHandler.user(req.params.userId).then(function(suc) {
            res.send(suc);
        },
        function(err){
            res.send(err);
        });
    });

    app.get("/rooms/:alias", function(req, res) {
        asapiRequestHandler.alias(req.params.alias).then(function(suc) {
            res.send(suc);
        },
        function(err) {
            res.send(err);
        });
    });

    app.put("/transactions/:txnId", function(req, res) {
        var hsToken = req.query.access_token;
        var txnId = req.params.txnId;
        if (!hsToken || !txnId) {
            res.send("Missing token or transaction ID.");
            return;
        }
        if (!req.body || !req.body.events) {
            res.send("Missing events body.");
            return;
        }
        var events = req.body.events;
        asapiRequestHandler.transaction(events, txnId, hsToken).then(
            function(suc) {
                res.send(suc);
            },
            function(err) {
                res.send(err);
            }
        );
    });
};

/*
 * Register with the specified home server.
 * @param {String} hsUrl The home server to register with.
 * @param {String} asUrl The application service URL to hit for incoming requests.
 * @param {String} asToken The application service token.
 * @param {Object} namespaces The namespaces Object
 * @returns {Promise} A promise which will be resolved if the request was 
 * successful, or rejected if the call was not successful.
 */
module.exports.register = function(hsUrl, asUrl, asToken, namespaces) {
    // POST /register
    // { url: "string", as_token: "string", "namespaces": Object }
    var endpoint = url.resolve(hsUrl, PREFIX + "/register");
    var body = {
        url: asUrl,
        as_token: asToken,
        namespaces: namespaces
    };
    console.log("/register => %s", JSON.stringify(body));
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

/*
 * Unregister with the specified home server.
 * @param {String} hsUrl The home server to unregister from.
 * @param {String} asToken The application service token.
 * @returns {Promise} A promise which will be resolved if the request was 
 * successful, or rejected if the call was not successful.
 */
module.exports.unregister = function(hsUrl, asToken) {
    // POST /unregister
    // { as_token: "string"}
    var endpoint = url.resolve(hsUrl, PREFIX + "/unregister");
    var body = {
        as_token: asToken
    };
    console.log("/unregister => %s", JSON.stringify(body));
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

