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
        user: {
        //   resolverName: fn
        },
        alias: {
        //   resolverName: fn    
        }
    };
    this.requestHandler = new asapi.AsapiRequestHandler();
    var that = this;
    this.requestHandler.user = function(userId) {
        var defer = q.defer();
        askHandlers(that.queryResolvers.user, userId).then(function() {
            defer.resolve("OK");
        },
        function(err) {
            defer.reject("NOK");
        });
        return defer.promise;
    };
    this.requestHandler.alias = function(roomAlias) {
        var defer = q.defer();
        askHandlers(that.queryResolvers.alias, roomAlias).then(function() {
            defer.resolve("OK");
        },
        function(err) {
            defer.reject("NOK");
        });
        return defer.promise;
    };
};

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

    if (["user", "alias"].indexOf(opts["type"]) == -1) {
        console.error("'type' must be 'user' or 'alias'");
        return;
    }
    this.queryResolvers[opts["type"]][opts["name"]] = fn;
};

module.exports = AsapiController;