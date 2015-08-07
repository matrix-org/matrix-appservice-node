"use strict";
var express = require("express");
var bodyParser = require('body-parser');
var morgan = require("morgan");
var util = require("util");
var EventEmitter = require("events").EventEmitter;

/**
 * Construct a new application service.
 * @param {Object} config Configuration for this service.
 * @param {String} config.homeserverToken Required. The incoming HS token to expect.
 * @param {Number} config.httpMaxSizeBytes The max number of bytes allowed on an
 * incoming HTTP request. Default: 5000000.
 * @throws If a homeserver token is not supplied.
 */
function AppService(config) {
    var self = this;
    this.config = config;
    if (!this.config || !this.config.homeserverToken) {
        throw new Error("Missing config.homeserverToken");
    }
    this.app = express();
    this.app.use(morgan("combined", {
        stream: {
            write: function(str) {
                self.emit("http-log", str);
            }
        }
    }));

    this.app.use(bodyParser.json({
        limit: config.httpMaxSizeBytes || 5000000  // 5MB
    }));

    function isInvalidToken(req, res) {
        var hsToken = req.query.access_token;
        if (hsToken !== self.config.homeserverToken) {
            res.send({
                errcode: "M_FORBIDDEN",
                error: "Bad token supplied,"
            });
            return true;
        }
        return false;
    }

    this.app.get("/users/:userId", function(req, res) {
        if (isInvalidToken(req, res)) {
            return;
        }
        self.onUserQuery(req.params.userId, function() {
            res.send({});
        });
    });

    this.app.get("/rooms/:alias", function(req, res) {
        if (isInvalidToken(req, res)) {
            return;
        }
        self.onAliasQuery(req.params.alias, function() {
            res.send({});
        });
    });

    var lastProcessedTxnId;
    this.app.put("/transactions/:txnId", function(req, res) {
        if (isInvalidToken(req, res)) {
            return;
        }

        var txnId = req.params.txnId;
        if (!txnId) {
            res.send("Missing transaction ID.");
            return;
        }
        if (!req.body || !req.body.events) {
            res.send("Missing events body.");
            return;
        }
        var events = req.body.events;

        if (lastProcessedTxnId === txnId) {
            res.send({}); // duplicate
            return;
        }
        for (var i = 0; i < events.length; i++) {
            self.emit("event", events[i]);
            if (events[i].type) {
                self.emit("type:" + events[i].type, events[i]);
            }
        }
        lastProcessedTxnId = txnId;
        res.send({});
    });
}
util.inherits(AppService, EventEmitter);

/**
 * Override this method to handle alias queries.
 * @param {string} alias The queried room alias
 * @param {Function} callback The callback to invoke when complete.
 */
AppService.prototype.onAliasQuery = function(alias, callback) {
    callback(); // stub impl
};

/**
 * Override this method to handle user queries.
 * @param {string} userId The queried user ID.
 * @param {Function} callback The callback to invoke when complete.
 */
AppService.prototype.onUserQuery = function(userId, callback) {
    callback(); // stub impl
};

AppService.prototype.setHomeServerToken = function(hsToken) {
    this.config.homeserverToken = hsToken;
};

AppService.prototype.listen = function(port) {
    this.app.listen(port);
};

/** The application service class */
module.exports = AppService;
