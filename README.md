This is a Matrix Application Service framework written in Node.js with Express.

This can be used to quickly setup performant application services for almost 
anything you can think of.

Usage (developers)
==================

The main use for this framework is for creating new ``services`` which interact
with third-party APIs. Services look something like this:

``` javascript
module.exports.serviceName = "an-example-service-name";
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

module.exports.register = function(controller, serviceConfig) {
    controller.addRegexPattern("aliases", "#log_.*", false);
    controller.setAliasQueryResolver(aliasHandler);

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

This will run the logging service, listening on port 3500. Multiple services can be registered.

Framework
=========

Service config
--------------
This is an Object which has the following keys/values:
 - ``service`` => ``Object``: The value is the desired service to register, e.g. ``require("matrix-appservice-irc")``
 - ``hs`` => ``String``: The base home server URL to hit to register with.
 - ``token`` => ``String``: The application service token.
 - ``as`` => ``String``: The base application service URL that the home server should hit for incoming events.
 - ``port`` => ``Number``: The port to listen on.

matrix-appservice
-----------------
This is the object returned when performing ``require("matrix-appservice")``. It has the following methods:
 - ``registerServices(servicesConfigs)``: Configure a web server for each service and invoke the ``register``
   method for each service.
   * ``serviceConfigs`` (Array<Object>): An array of service configs.
 - ``runForever()``: For each registered service, listen on the specified port.

asapi-controller
----------------
This is the main controller for this framework. This performs basic operations including:
 - Verifying the home server token.
 - Checking for duplicate transactions.
 - Emitting incoming events for services to receive.
 - Handling registration regex.

It has the following methods:
 - ``setUserQueryResolver(fn)``: Sets a function to invoke when the home server calls the User Query API.
   * ``fn`` (Function): The function to invoke, which has a single String arg ``userId``. This should return a Promise
     which is resolved if the user exists, or rejected if the user does not exist.
 - ``setAliasQueryResolver(fn)``: Sets a function to invoke when the home server calls the Alias Query API.
   * ``fn`` (Function): The function to invoke, which has a single String arg ``roomAlias``. This should return a Promise
     which is resolved if the alias exists, or rejected if the alias does not exist.
 - ``addRegexPattern(type, regex, exclusive)``: Add a regex pattern to be registered.
   * ``type`` (String): The type of regex pattern. Must be 'users' or 'aliases'.
   * ``regex`` (String): The regex pattern.
   * ``exclusive`` (Boolean): True to reserve the matched namespace.
 - ``register(hsUrl, asUrl, asToken)``: [PRIVATE] Register with the home server. Services should not need to
   invoke this manually, as it is called for you in ``matrix-appservice.runForever()``.
 - ``setHomeserverToken(hsToken)``: Set the home server token to use when checking incoming requests. This will
   prevent registration if it is called before the ``register`` method.
   * ``hsToken`` (String): The home server token.
 - ``on(nodeEventType, fn)``: Listens for the specified event type, and invoke the specified function.

Emitted Events
--------------
``asapi-controller`` will emit Node.js events when incoming events are sent to the AS by the HS. The list of possible event types are:
 - ``event`` (emits Object): A generic catch-all which is emitted for every incoming event.
 - ``type:[event.type]`` (emits Object) : An event emitted for the specified type e.g. ``type:m.room.message``
 - ``registered`` (emits Object): Emitted when the AS successfully registers with the HS. Contains an object with
   a key ``hsToken`` for the home server token. To prevent re-registration on startup, call
  ``controller.setHomeserverToken(hsToken)`` in your service's ``register(controller, config)`` function.

Service API
===========
Services can be built as separate node packages. As a result, they need to conform to the same interface in order for ``matrix-appservice`` to use them. The package's ``module.exports`` must have the following:
 - ``serviceName`` (String): The name of the service. Typically the package name e.g. ``matrix-appservice-foo``.
 - ``configure(opts)``: The service specific configuration.
   * ``opts`` (Object): Any specific configuration information your service requires. This is completely separate
     to the Service Config.
 - ``register(controller, config)``: Set up this service for the provided controller.
   * ``controller`` (AsapiController): The controller instance to register with.
   * ``config`` (Object): The Service Config to use for requests (e.g. to the Client-Server API). This contains
     the base homeserver URL as well as the application service token you should be using to authorise your service.
