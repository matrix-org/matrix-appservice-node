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
        srvConfig.service.register(controller);
        // TODO handle as hs port token, controller per service?
    }
    configs = serviceConfigs;
};

module.exports.runForever = function() {
    // TODO store HS token somewhere to prevent re-register on every startup.
    controller.register(configs[0].hs, configs[0].as, configs[0].token).then(
                              function(hsToken) {
        console.log("Registered with token %s", hsToken);
        configs[0].server = app.listen(3000, function() {
            var host = configs[0].server.address().address;
            var port = configs[0].server.address().port;
            console.log("Listening at %s on port %s", host, port);
        });
    },
    function(err) {
        console.error("Unable to register for token: %s", JSON.stringify(err));
    });
};


