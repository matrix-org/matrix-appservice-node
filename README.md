This is a Matrix Application Service framework written in Node.js with Express.

This can be used to quickly setup performant application services for almost 
anything you can think of in a framework agnostic way.

What does it do
===============
This framework does two things:
 - It specifies a basic API with several functions which can be used
   to create an application service.
 - It uses Express to run a web server for the application service.

Why should I use it?
====================
Application services should be written in a way which is agnostic to the web
application framework being used (Express, Koa, Hapi, Restify, etc) in order to
allow the same application service package to be used for all of them. This
project allows this by specifying a set of functions which are common for all
web application frameworks (e.g. the port to listen on). This framework also
provides common AS API operations such as verifying the HS token and 
suppressing duplicate transactions.

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
``matrix-appservice-logging``. As you can see, it doesn't mention any web
framework at all; it is just the raw application-specific code along with
several AS API method calls.

Usage (End-users)
=================

End users need to pick and choose a service to run for their AS and
configure them. This can be done like this:

``` javascript
var appservice = require("matrix-appservice");
var logging = require("matrix-appservice-logging");

appservice.registerService({
    service: logging,
    homeserver: {
        url: "http://localhost:8008",
        token: "a62b3cde826f274a310900a7bc373dd27"
    },
    appservice: {
        url: "http://localhost:3500"
        token: "1b323cd243fee"
    },
    http: {
        port: 3500
    }
});
appservice.runForever();
```

This will run the logging service, listening on port 3500. To generate the
application registration file:
``` javascript
// return the config files which need to be put in the homeserver
var yaml = require("js-yaml");
appservice.getRegistration().done(function(registration) {
    console.log(yaml.safeDump(registration));
});
```

Framework
=========

Service config
--------------
This is an Object which has the following keys/values:
 - ``service`` => ``Object``: The value is the desired service to register, e.g.
 ``require("matrix-appservice-irc")``
 - ``homeserver`` => ``Object``: Configuration for the homeserver:
    * ``url`` => ``String`` : The home server URL the AS should make requests to.
    * ``token`` => ``String`` : The home server token which will be added on requests from the HS.
 - ``appservice`` => ``Object``: Configuration for the application service:
    * ``token`` => ``String`` : The application service token.
    * ``url`` => ``String`` : The base application service URL that the home server
      should hit for incoming events.
 - ``http`` => ``Object`` : Configuration for the AS HTTP server:
    * ``port`` => ``Number``: The port to listen on.
    * ``maxSize`` => ``Number`` : (Optional) The max number of bytes to accept
      in a single request before sending a HTTP 413.

matrix-appservice
-----------------
This is the object returned when performing ``require("matrix-appservice")``. It
has the following methods:
 - ``registerService(serviceConfig)``: Configure a web server for the given 
   service and invoke the ``register`` method on it.
   * ``serviceConfig`` => ``Object``: A service config.
 - ``getRegistration()``: Get the registration YAML files for the registered
   service. Returns a ``Promise`` which resolves to an ``Object`` which 
   represents the desired registration YAML. This object can be safely dumped
   by a YAML parser.
 - ``runForever()``: Start listening for this service.

asapi-controller
----------------
This is the main controller for this framework. This performs basic operations 
including:
 - Verifying the home server token.
 - Checking for duplicate transactions.
 - Emitting incoming events for services to receive.
 - Handling registration regex.

It has the following methods:
 - ``setUserQueryResolver(fn)``: Sets a function to invoke when the home server
 calls the User Query API.
   * ``fn`` (Function): The function to invoke, which has a single String arg
   ``userId``. This should return a Promise which is resolved if the user 
   exists, or rejected if the user does not exist.

 - ``setAliasQueryResolver(fn)``: Sets a function to invoke when the home server
 calls the Alias Query API.
   * ``fn`` (Function): The function to invoke, which has a single String arg
   ``roomAlias``. This should return a Promise which is resolved if the alias
   exists, or rejected if the alias does not exist.

 - ``setLogger(fn)``: Sets a function to be invoked with HTTP log lines.
   * ``fn`` (Function): The function to invoke, which has a single String arg 
   ``line``.

 - ``addRegexPattern(type, regex, exclusive)``: Add a regex pattern to be 
 registered.
   * ``type`` (String): The type of regex pattern. Must be 'users' or 'aliases'.
   * ``regex`` (String): The regex pattern.
   * ``exclusive`` (Boolean): True to reserve the matched namespace.

 - ``on(nodeEventType, fn)``: Listens for the specified event type, and invoke
 the specified function.

Emitted Events
--------------
``asapi-controller`` will emit Node.js events when incoming events are sent to
the AS by the HS. The list of possible event types are:
 - ``event`` (emits Object): A generic catch-all which is emitted for every
 incoming event.
 - ``type:[event.type]`` (emits Object) : An event emitted for the specified
 type e.g. ``type:m.room.message``

Service API
===========
Services can be built as separate node packages. As a result, they need to 
conform to the same interface in order for ``matrix-appservice`` to use them. 
The package's ``module.exports`` must have the following:
 - ``serviceName`` (String): The name of the service. Typically the package name
 e.g. ``matrix-appservice-foo``. This name is the default user ID localpart specified
 in the application service registration, so shouldn't contain special characters.

 - ``configure(opts)``: The service specific configuration.
   * ``opts`` (Object): Any specific configuration information your service
   requires. This is completely separate to the Service Config.

 - ``register(controller, config)``: Set up this service for the provided 
 controller.
   * ``controller`` (AsapiController): The controller instance to register with.
   * ``config`` (Object): The Service Config to use for requests (e.g. to the 
   Client-Server API). This contains the base homeserver URL as well as the
   application service token you should be using to authorise your service.
