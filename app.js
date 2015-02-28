"use strict";

var express = require("express");
var morgan = require("morgan");
var q = require("q");
var controller = require("./controllers/index.js");
var asapi = require("./controllers/asapi.js");
var config = require("./config");
var app = express();

app.use(morgan("combined"));
controller.setRoutes(app);

// low-level direct HTTP call (no state handling whatsoever)
asapi.register(config.homeServerUrl, config.applicationServiceUrl, config.applicationServiceToken, {
    users: [
        "@test_.*"
    ],
    aliases: [
        "#test_.*"
    ]
}).then(function(hsToken) {
    console.log("Got token: "+hsToken);
},
function(err) {
    console.error(err);
});


// higher-level hooks
controller.asapi.addQueryHandler({
    name: "test",
    type: "user"
}, function(userId) {
    if (userId.length == 5) {
        return q("yep");
    }
    return q.reject("narp");
});

var server = app.listen(config.port || 3000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Listening at %s on port %s", host, port);
});
