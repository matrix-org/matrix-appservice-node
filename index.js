"use strict";

// external libs
var crypto = require("crypto");
var express = require("express");
var bodyParser = require('body-parser');
var morgan = require("morgan");
var q = require("q");

// internal libs
var asapi = require("./api/asapi.js");
var AsapiController = require("./controllers/asapi-controller.js");

var configs = [];

module.exports.registerServices = function(serviceConfigs) {
    for (var i=0; i<serviceConfigs.length; i++) {
        var srvConfig = serviceConfigs[i];
        console.log("matrix-appservice: Registering service '%s'", 
            srvConfig.service.serviceName);
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
        app.use(bodyParser.json());
        asapi.setRoutes(app, controller.requestHandler);

        var defer = srvConfig.service.register(controller, srvConfig);
        srvConfig._internal = {
            app: app,
            controller: controller,
            defer: defer
        };
    }
    configs = serviceConfigs;
};

module.exports.getConfigFiles = function() {
    var defer = q.defer();
    var configEntries = [];
    var outstandingPromises = [];
    configs.forEach(function(config, index) {
        if (config._internal.defer) {
            console.log("matrix-appservice: Waiting on %s register() to finish", 
                config.service.serviceName);
            outstandingPromises.push(config._internal.defer);
            config._internal.defer.done(function() {
                configEntries.push(getServiceConfig(config));
            });
        }
        else {
            configEntries.push(getServiceConfig(config));
        }
    });
    q.all(outstandingPromises).done(function() {
        defer.resolve(configEntries);
    });
    return defer.promise;
};

module.exports.runForever = function() {
    configs.forEach(function(config, index) {
        if (config._internal.defer) {
            console.log("matrix-appservice: Waiting on %s register() to finish", 
                config.service.serviceName);
            config._internal.defer.done(function() {
                runService(config);
            });
        }
        else {
            runService(config);
        }
    });
};

var getServiceConfig = function(config) {
    var hsToken = (
        config._internal.controller.hsToken || crypto.randomBytes(64).toString('hex')
    );
    var localpart = config.localpart || config.service.serviceName;
    return {
        url: config.as,
        as_token: config.token,
        hs_token: hsToken,
        sender_localpart: localpart,
        namespaces: config._internal.controller.namespaces
    }
};

var runService = function(config) {
    config._internal.server = config._internal.app.listen(
            config.port || (3000+index), function() {
        var host = config._internal.server.address().address;
        var port = config._internal.server.address().port;
        console.log("matrix-appservice: %s listening at %s on port %s", 
            config.service.serviceName, host, port);
    });
};


