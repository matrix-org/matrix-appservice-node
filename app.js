"use strict";

var express = require("express");
var morgan = require("morgan");
var q = require("q");
var config = require("./config");
var app = express();

app.use(morgan("combined"));

// higher-level hooks
var controller = require("./controllers/index.js");
controller.setRoutes(app);
controller.asapi.addQueryHandler({
    name: "test",
    type: "users"
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
