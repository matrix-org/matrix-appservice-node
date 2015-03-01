This is a Matrix Application Service framework written in Node.js with Express.

This can be used to quickly setup performant application services for almost anything you can think of.

Usage
=====

The main use for this framework is for creating new ``services`` which interact with third-party APIs.

The framework is primarily compromised of ``controllers`` which add core functionality onto the raw AS HTTP
API calls. Controllers automatically control common aspects of AS API development, such as checking home
server tokens, checking for duplicate transactions, etc. They also provide a modular way to add 
functionality on top of the AS API:

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

Alternatively, to do the bare minimum HTTP calls required by the AS API specification, you can use the ``asapi`` module. This does not handle anything for you: it simply wraps the HTTP calls and presents a promise interface (using ``Q``). You will be responsible for checking tokens, preventing duplicate transactions, etc.

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

Services are built on top of ``controllers`` to perform something useful, such as integrating with a specific third-party API, or providing a well-defined feature. All services must be built on top of the core controller: ``asapi-controller`` in order for them to receive events and queries from Express. For this example, we'll make a service which just logs messages.

Create a ``service`` which can register itself with ``asapi-controller``:

``` javascript
// logging.js
var q = require("q");

var aliasHandler = function(roomAlias) {
    // create a room for this alias
};

module.exports.register = function(app, asapiController) {
    asapiController.addQueryHandler({
        name: "name of the service",
        type: "aliases",
        regex: "#log_.*",
    }, aliasHandler);

    // listen for m.room.message events to log
    asapiController.on("type:m.room.message", function(event) {
        console.log("Logging => %s", JSON.stringify(event));
    });
};
```

Then register the service with an ``AsapiController``:

``` javascript
var app = express();

// link the asapi api with an express app and asapi controller
var AsapiController = require("./controllers/asapi-controller.js");
var asapi = require("./api/asapi.js");
var controller = new AsapiController(asapi);
asapi.setRoutes(app, controller.requestHandler);

var loggingService = require("./services/logging.js");
loggingService.register(app, controller);
```

That's it. The logging service will now receive incoming requests and can process them accordingly.

Controllers
-----------

``asapi-controller`` : This is the main controller for this framework. This performs basic operations including:
 - Verifying the home server token .
 - Checking for duplicate transactions.
 - Emitting incoming events for services to receive.
 - Allowing multiple query handlers to handle incoming User Query or Alias Query HTTP calls.
 - Handling registration: in particular the desired regex.

``storage-controller //TODO`` : This controller stores incoming events for retrieval and searching at a later date. It is backed by MongoDB.

``client-controller //TODO`` : This controller exposes the "extended" client-server HTTP API for application services.

Emitted Events
--------------
``asapi-controller`` will emit Node.js events when incoming events are sent to the AS by the HS. The list of possible events are:
 - ``event`` : A generic catch-all which is emitted for every incoming event.
 - ``type:[event.type]`` : An event emitted for the specified type e.g. ``type:m.room.message``
