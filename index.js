"use strict";

// external libs
var crypto = require("crypto");
var express = require("express");
var bodyParser = require('body-parser');
var morgan = require("morgan");
var q = require("q");

// internal libs
var asapi = require("./lib/asapi.js");
var AsapiController = require("./lib/asapi-controller.js");

var config;

module.exports.registerService = function(srvConfig) {
    // sanity check
    srvConfig.homeserver = srvConfig.homeserver || {};
    srvConfig.appservice = srvConfig.appservice || {};
    srvConfig.http = srvConfig.http || {};
    if (!srvConfig.service || !srvConfig.http.port ||
            !srvConfig.homeserver.url || !srvConfig.homeserver.token ||
            !srvConfig.appservice.url || !srvConfig.appservice.token) {
        console.log("FATAL: Missing required fields in service config.");
        process.exit(1);
    }

    console.log("matrix-appservice: Registering service '%s'", 
        srvConfig.service.serviceName);
    config = srvConfig;
    var controller = new AsapiController(asapi);

    // app setup
    var app = express();
    app.use(morgan("combined", {
        stream: {
            write: function(str) {
                controller.loggerFn(str);
            }
        }
    }));

    app.use(bodyParser.json({
        limit: config.http.maxSize || 5000000  // 5MB
    }));
    asapi.setRoutes(app, controller.requestHandler);
    controller.hsToken = config.homeserver.token;
    var defer = config.service.register(controller, config);
    config._internal = {
        app: app,
        controller: controller,
        defer: defer
    };
};

module.exports.getRegistration = function() {
    var defer = q.defer();
    var serviceDefer = config._internal.defer || q("done");
    serviceDefer.done(function() {
        defer.resolve(getServiceRegistration(config));
    });
    return defer.promise;
};

module.exports.runForever = function() {
    var serviceDefer = config._internal.defer || q("done");
    serviceDefer.done(function() {
        runService(config);
    });
};

var getServiceRegistration = function(config) {
    var hsToken = config._internal.controller.hsToken;
    var localpart = config.localpart || config.service.serviceName;
    return {
        url: config.appservice.url,
        as_token: config.appservice.token,
        hs_token: hsToken,
        sender_localpart: localpart,
        namespaces: config._internal.controller.namespaces
    }
};

var runService = function(config) {
    config._internal.server = config._internal.app.listen(
            config.http.port, function() {
        var host = config._internal.server.address().address;
        var port = config._internal.server.address().port;
        console.log("matrix-appservice: %s listening at %s on port %s", 
            config.service.serviceName, host, port);
    });
};


