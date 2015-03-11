"use strict";

// external libs
var express = require("express");
var bodyParser = require('body-parser');
var morgan = require("morgan");
var q = require("q");

// app setup
var app = express();
app.use(morgan("combined"));
app.use(bodyParser.json());

// internal libs
var asapi = require("./api/asapi.js");
var AsapiController = require("./controllers/asapi-controller.js");
var controller = new AsapiController(asapi);
asapi.setRoutes(app, controller.requestHandler);

var configs = [];

module.exports.registerServices = function(serviceConfigs) {
    for (var i=0; i<serviceConfigs.length; i++) {
        var srvConfig = serviceConfigs[i];
        console.log("Registering service '%s'", srvConfig.service.serviceName);
        srvConfig.service.register(controller, srvConfig);
    }
    configs = serviceConfigs;
};

module.exports.runForever = function() {
    // TODO store HS token somewhere to prevent re-register on every startup.
    configs.forEach(function(config, index) {
        controller.register(config.hs, config.as, config.token).then(
                                  function(hsToken) {
            console.log("Registered with token %s", hsToken);
            config.server = app.listen(config.port || (3000+index), function() {
                var host = config.server.address().address;
                var port = config.server.address().port;
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


