This is a Matrix Application Service framework written in Node.js with Express.

This can be used to quickly setup performant application services for almost anything you can think of.

Usage
=====

The framework is primarily used by using ``controllers`` which add core functionality onto the raw AS HTTP
API calls:

``` javascript
var express = require("express");
var q = require("q");
var asapi = require("./api/asapi.js");
var app = express();

// higher-level hooks allow things like multiple query handlers
// and modular registration regex and is built on top of asapi
var AsapiController = require("./controllers/asapi-controller.js");
controller = new AsapiController(asapi);
asapi.setRoutes(app, controller.requestHandler);
controller.addQueryHandler({
    name: "testQueryHandler",
    type: "users",
    regex: "@test_.*"
}, function(userId) {
    // only accept user IDs with 8 characters
    if (userId.length == 8) {
        return q({});
    }
    return q.reject("narp");
});
controller.register("http://localhost:8008", "http://localhost:3000", "1234567890").then(function(hsToken) {
    console.log("Registered with token %s", hsToken);
});

app.listen(3000);
```

Alternatively, to do the bare minimum HTTP calls required by the AS API specification, you can use the ``asapi`` module. This does not handle anything for you: it simply wraps the HTTP calls and presents a promise interface (using ``Q``).

``` javascript
var express = require("express");
var q = require("q");
var app = express();
var asapi = require("./api/asapi.js");

// do a POST /register call
asapi.register("http://localhost:8008", "http://localhost:3000", "it5a5ecr3t23v3ry1", {
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

// setup incoming query hooks
var handler = new asapi.AsapiRequestHandler();
handler.user = function(userId) {
    if (userId.indexOf("test") != -1) {
        return q({});
    }
    return q.reject("Not a test user.");
};
asapi.setRoutes(app, handler);

app.listen(3000);
```

Services
--------

Services use ``controllers`` to perform something useful, such as integrating with a specific third-party API, or providing a core piece of functionality. For this example, we'll make a service which just logs messages.

Create a ``service`` which can register itself with a ``controller``:

``` javascript
// logging.js
var q = require("q");

var aliasHandler = function(roomAlias) {
    // create a room for this alias
};

module.exports.register = function(app, controller) {
    controller.addQueryHandler({
        name: "name of the service",
        type: "aliases",
        regex: "#log_.*",
    }, aliasHandler);

    // listen for m.room.message events to log
};
```

Then register the service with an ``AsapiController``:

``` javascript
var app = express();
var AsapiController = require("./controllers/asapi-controller.js");
var asapi = require("./api/asapi.js");
var controller = new AsapiController(asapi);
asapi.setRoutes(app, controller.requestHandler);

var loggingService = require("./services/logging.js");
loggingService.register(app, controller);
```

That's it. The logging service will now receive incoming requests and can process them accordingly.
