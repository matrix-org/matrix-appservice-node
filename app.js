'use strict';

var express = require("express");
var morgan = require("morgan");
var controller = require("./controllers/index.js");
var app = express();

app.use(morgan("combined"));
controller.setRoutes(app);

var server = app.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Listening at %s on port %s", host, port);
});
