"use strict";
var express = require("express");
var bodyParser = require('body-parser');
var morgan = require("morgan");
var util = require("util");
var EventEmitter = require("events").EventEmitter;

/**
 * Construct a new application service.
 * @param {Object} config Configuration for this service.
 * @param {String} config.hsToken Required. The incoming HS token to expect.
 * @param {Number} config.httpMaxSizeBytes The max number of bytes allowed on an
 * incoming HTTP request. Default: 5000000.
 * @throws If a homeserver token is not supplied.
 */
function AppService(config) {
    var self = this;
    this.config = config;
    if (!this.config.hsToken) {
        throw new Error("Missing config.hsToken");
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

    this.app.get("/users/:userId", function(req, res) {
        asapiRequestHandler.user(req.params.userId).then(function(suc) {
            res.send(suc);
        },
        function(err){
            res.send(err);
        });
    });

    this.app.get("/rooms/:alias", function(req, res) {
        asapiRequestHandler.alias(req.params.alias).then(function(suc) {
            res.send(suc);
        },
        function(err) {
            res.send(err);
        });
    });

    var lastProcessedTxnId;
    this.app.put("/transactions/:txnId", function(req, res) {
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
        if (hsToken !== self.config.hsToken) {
            res.send({
                errcode: "M_FORBIDDEN",
                error:"Bad token supplied,"
            });
            return;
        }
        if (lastProcessedTxnId === txnId) {
            res.send({}); // duplicate
            return;
        }
        for (var i=0; i<events.length; i++) {
            self.emit("event", events[i]);
            if (events[i].type) {
                self.emit("type:"+events[i].type, events[i]);
            }
        }
        lastProcessedTxnId = txnId;
        res.send({});
    });
}
util.inherits(AppService, EventEmitter);

AppService.prototype.setHomeServerToken = function(hsToken) {
    this.hsToken = hsToken;
};

AppService.prototype.listen = function(port) {
    this.app.listen(port);
};

/** The application service class */
module.exports = AppService;