"use strict";

// external libs
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
        console.log("Registering service '%s'", srvConfig.service.serviceName);

        // app setup
        var app = express();
        app.use(morgan("combined"));
        app.use(bodyParser.json());
        var controller = new AsapiController(asapi);
        asapi.setRoutes(app, controller.requestHandler);

        srvConfig.service.register(controller, srvConfig);
        srvConfig._internal = {
            app: app,
            controller: controller
        };
    }
    configs = serviceConfigs;
};

module.exports.runForever = function() {
    configs.forEach(function(config, index) {
        config._internal.controller.register(
                config.hs, config.as, config.token).then(function(hsToken) {
            config._internal.server = config._internal.app.listen(
                    config.port || (3000+index), function() {
                var host = config._internal.server.address().address;
                var port = config._internal.server.address().port;
                console.log("Listening at %s on port %s", host, port);
            });
        },
        function(err) {
            console.error(
                "Unable to register for token: %s", JSON.stringify(err)
            );
        });
    });
};


