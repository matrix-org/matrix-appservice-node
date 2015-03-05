Architecture

```
                                +-------------+
        +---- makes use of ---> | libraries   |--+
        |          (1)          +-------------+  |
   +---------+                     +-------------+
   | Service |--+                        +------------------+                       +------------------------------+
   +---------+  |  -- registers with --> | asapi-controller | -- registers with --> | web framework (e.g. Express) |
     +----------+           (2)          +------------------+         (3)           +------------------------------+
                           
  (1) - Using extended matrix-js-sdk, AS database helper, etc
  (2) - addQueryHandler, register syntax
  (3) - Specific to web framework being used, multiple ports (1/service potentially)  
```

- We can't register multiple services in one fell swoop, because we can't tell which incoming event is for which service.
- Need to register an AS for each service hooked in.
- Should cluster this so each service has its own JS event loop (``cluster`` module?)
- Aim is to get "writing an AS" down to "write a service" which has function calls for extended CS, common AS DB ops (using
  MongoDB), and a well-defined hook to register the resulting service. 
  
These services can be published on ``npm`` (similar to how ``karma`` plugins are added as node modules), so anyone can end
up doing something like:

```
// app.js
  var appservice = require("matrix-appservice");
  var elasticSearch = require("matrix-appservice-elasticsearch");
  var ircBridge = require("matrix-appservice-irc");
  
  ircBridge.configure({
    token: "my_secret_token",
    hs: "https://matrix.example.com",
    inboundPort: 3545
  });
  elasticSearch.configure({
    token: "my_other_secret_token",
    hs: "https://matrix.example.com"
  });
  
  appservice.registerServices([ircBridge, elasticSearch]);
  appservice.runForever();
```
  
