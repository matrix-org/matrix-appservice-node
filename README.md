This is a Matrix Application Service framework written in Node.js with Express.

This can be used to quickly setup performant application services for almost 
anything you can think of.

Usage (developers)
==================

The main use for this framework is for creating new ``services`` which interact
with third-party APIs. Services look something like this:

``` javascript
var q = require("q");

var aliasHandler = function(roomAlias) {
    console.log("loggingService: Receive new room '%s'", roomAlias);
    // TODO: Handle room alias query
    return q.reject({});
};

var handleEvent = function(event) {
    console.log("RECV %s", JSON.stringify(event));
};

module.exports.configure = function(opts) {
    // TODO: Any configuration handling (e.g. logging format)  
};

module.exports.register = function(controller) {
    controller.addQueryHandler({
        name: "logging-service(arbitrary-string)",
        type: "aliases",
        regex: "#log_.*",
        exclusive: false
    }, aliasHandler);

    // listen for m.room.message events to log
    controller.on("type:m.room.message", handleEvent);
};
```

This example is a complete service, and could now be uploaded to npm as
``matrix-appservice-logging``.

Usage (End-users)
=================

End users need to pick and choose which services to use for their AS and
configure them. This can be done like this:

``` javascript
var appservice = require("matrix-appservice");
var logging = require("matrix-appservice-logging");

appservice.registerServices([
{
    service: logging,
    hs: "http://localhost:8008",
    token: "1234567890",
    as: "http://localhost:3500",
    port: 3500
}
]);
appservice.runForever();
```

Framework
=========

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
