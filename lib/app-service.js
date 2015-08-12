"use strict";
var express = require("express");
var bodyParser = require('body-parser');
var morgan = require("morgan");
var util = require("util");
var EventEmitter = require("events").EventEmitter;

/**
 * Construct a new application service.
 * @constructor
 * @param {Object} config Configuration for this service.
 * @param {String} config.homeserverToken The incoming HS token to expect. Must
 * be set prior to calling listen(port).
 * @param {Number} config.httpMaxSizeBytes The max number of bytes allowed on an
 * incoming HTTP request. Default: 5000000.
 * @throws If a homeserver token is not supplied.
 */
function AppService(config) {
    var self = this;
    this.config = config || {};
    this.app = express();
    this.app.use(morgan("combined", {
        stream: {
            write: function(str) {
                /**
                 * An HTTP log line.
                 * @event AppService#http-log
                 * @type {String}
                 * @example
                 * appService.on("http-log", function(logLine) {
                 *   console.log(logLine);
                 * });
                 */
                self.emit("http-log", str);
            }
        }
    }));

    this.app.use(bodyParser.json({
        limit: this.config.httpMaxSizeBytes || 5000000  // 5MB
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
            /**
             * An incoming Matrix JSON event.
             * @event AppService#event
             * @type {Object}
             * @example
             * appService.on("event", function(ev) {
             *   console.log("ID: %s", ev.event_id);
             * });
             */
            self.emit("event", events[i]);
            if (events[i].type) {
                /**
                 * An incoming Matrix JSON event, filtered by <code>event.type</code>
                 * @event AppService#type:event
                 * @type {Object}
                 * @example
                 * appService.on("type:m.room.message", function(ev) {
                 *   console.log("Body: %s", ev.content.body);
                 * });
                 */
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

/**
 * Set the token that should be used to verify incoming events.
 * @param {string} hsToken The home server token
 */
AppService.prototype.setHomeserverToken = function(hsToken) {
    this.config.homeserverToken = hsToken;
};

/**
 * Begin listening on the specified port.
 * @param {Number} port The port to listen on.
 */
AppService.prototype.listen = function(port) {
    this.app.listen(port);
};

/** The application service class */
module.exports = AppService;
