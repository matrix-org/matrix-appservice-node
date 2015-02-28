This is a Matrix Application Service framework written in Node.js with Express.

Usage
=====
To do the bare minimum HTTP calls required by the AS API specification, you can use the ``asapi`` module.

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

Alternatively, you can use ``controllers`` to augment the AS API in more useful ways:

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
