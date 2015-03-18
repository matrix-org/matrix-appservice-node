"use strict";

var q = require("q");
var util = require("util");
var EventEmitter = require("events").EventEmitter;

function AsapiController(asapi) {
    this.asapi = asapi;
    this.queryResolvers = {
        users: undefined,  // function
        aliases: undefined  // function
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
        if (!that.queryResolvers.users) {
            console.error("Received user query for %s but no handler setup.",
                          userId);
            return q.reject({});
        }

        that.queryResolvers.users(userId).done(function() {
            defer.resolve({});
        },
        function(err) {
            defer.reject({
                "errcode": "M_NOT_FOUND"
            });
        });
        return defer.promise;
    };
    this.requestHandler.alias = function(roomAlias) {
        var defer = q.defer();
        if (!that.queryResolvers.aliases) {
            console.error("Received alias query for %s but no handler setup.",
                          roomAlias);
            return q.reject({});
        }

        that.queryResolvers.aliases(roomAlias).done(function() {
            defer.resolve({});
        },
        function(err) {
            defer.reject({
                "errcode": "M_NOT_FOUND"
            });
        });
        return defer.promise;
    };
    this.requestHandler.transaction = function(events, txnId, hsToken) {
        // verify the home server token
        if (hsToken != that.hsToken) {
            console.error("Invalid homeserver token");
            return q.reject({
                errcode: "M_FORBIDDEN",
                error:"Bad token supplied,"
            });
        }
        // TODO if processed this txnId then ignore it and return success.
        for (var i=0; i<events.length; i++) {
            that.emit("event", events[i]);
            if (events[i].type) {
                that.emit("type:"+events[i].type, events[i]);
            }
        }
        return q({});
    };
};
util.inherits(AsapiController, EventEmitter);


AsapiController.prototype.setUserQueryResolver = function(fn) {
    this.queryResolvers.users = fn;
};

AsapiController.prototype.setAliasQueryResolver = function(fn) {
    this.queryResolvers.aliases = fn;
};

/*
 * Add a regex pattern to be registered.
 * @param {String} type : The type of regex pattern. Must be 'users' or 
 * 'aliases'.
 * @param {String} regex : The regex pattern.
 * @param {Boolean} exclusive : True to reserve the matched namespace.
 */
AsapiController.prototype.addRegexPattern = function(type, regex, exclusive) {
    if (exclusive === undefined) {
        exclusive = true;
    }

    if (typeof regex != "string") {
        console.error("Regex must be a string");
        return;
    }
    if (typeof exclusive != "boolean") {
        console.error("Exclusive must be a boolean");
    }
    if (["users", "aliases"].indexOf(type) == -1) {
        console.error("'type' must be 'users' or 'aliases'");
        return;
    }

    var regexObject = {
        exclusive: exclusive,
        regex: regex
    };

    this.namespaces[type].push(regexObject);
};

AsapiController.prototype.register = function register(hsUrl, asUrl, asToken) {
    var defer = q.defer();
    var that = this;
    if (this.hsToken) {
        console.log("Already registered.");
        return q(this.hsToken);
    }
    this.asapi.register(hsUrl, asUrl, asToken, this.namespaces).then(function(hsToken) {
        that.hsToken = hsToken;
        that.emit("registered", {
            hsToken: hsToken,
            namespaces: that.namespaces
        });
        defer.resolve(hsToken);
    }, function(err) {
        defer.reject(err);
    });
    return defer.promise;
};

AsapiController.prototype.setHomeserverToken = function(hsToken) {
    this.hsToken = hsToken;
};

module.exports = AsapiController;
