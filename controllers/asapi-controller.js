"use strict";

var q = require("q");
var events = require("events");

var askHandlers = function(resolvers, param) {
    var promises = [];
    Object.keys(resolvers).forEach(function(key) {
        promises.push(resolvers[key](param));
    })
    return q.all(promises);
};

function AsapiController(asapi) {
    this.asapi = asapi;
    this.queryResolvers = {
        users: {
        //   resolverName: fn
        },
        aliases: {
        //   resolverName: fn    
        }
    };
    this.namespaces = {
        users:[],
        aliases:[],
        rooms:[]
    };
    this.hsToken = undefined;
    this.requestHandler = new asapi.AsapiRequestHandler();
    var that = this;
    this.requestHandler.user = function(userId) {
        var defer = q.defer();
        askHandlers(that.queryResolvers.users, userId).then(function() {
            defer.resolve("OK");
        },
        function(err) {
            defer.reject("NOK");
        });
        return defer.promise;
    };
    this.requestHandler.alias = function(roomAlias) {
        var defer = q.defer();
        askHandlers(that.queryResolvers.aliases, roomAlias).then(function() {
            defer.resolve("OK");
        },
        function(err) {
            defer.reject("NOK");
        });
        return defer.promise;
    };
    this.requestHandler.transaction = function(events, txnId, hsToken) {
        // verify the home server token
        if (hsToken != that.hsToken) {
            console.error("Invalid homeserver token");
            return q.reject("Bad token");
        }
        // TODO if processed this txnId then ignore it and return success.
        // TODO pass events on to interested listeners (emit events?).
        return q("Yep");
    };
};

/*
 * Add a generic query handler for incoming queries.
 * @param {Object} opts The query options which must have a "name" for the
 * handler, as well as a "type" which is either "users" or "aliases".
 * @param {Function} fn The function to invoke when there is a query. The first
 * arg will contain the ID being queried (user ID, room alias). This function
 * should return a Promise which is resolved if the query was successful, or
 * rejected if the query was not successful.
 */
AsapiController.prototype.addQueryHandler = function addQueryHandler(opts, fn) {
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

    if (["users", "aliases"].indexOf(opts["type"]) == -1) {
        console.error("'type' must be 'users' or 'aliases'");
        return;
    }
    this.queryResolvers[opts["type"]][opts["name"]] = fn;
    if (opts["regex"]) {
        this.namespaces[opts["type"]].push(opts["regex"]);
    }
};

AsapiController.prototype.register = function register(hsUrl, asUrl, asToken) {
    var defer = q.defer();
    var that = this;
    this.asapi.register(hsUrl, asUrl, asToken, this.namespaces).then(function(hsToken) {
        that.hsToken = hsToken;
        defer.resolve(hsToken);
    }, function(err) {
        defer.reject(err);
    });
    return defer.promise;
};

module.exports = AsapiController;