This is a Matrix Application Service framework written in Node.js.

This can be used to quickly setup performant application services for almost 
anything you can think of in a web framework agnostic way.

To create an app service registration file:
``` javascript
var AppServiceRegistration = require("matrix-appservice").AppServiceRegistration;

// creating registration files
var reg = new AppServiceRegistration();
reg.setAppServiceUrl("http://localhost:8010");
reg.setHomeserverToken(AppServiceRegistration.generateToken());
reg.setAppServiceToken(AppServiceRegistration.generateToken());
reg.setSenderLocalpart("example-appservice");
reg.addRegexPattern("users", "@.*", true);
reg.outputAsYaml("registration.yaml");
```

You only need to generate a registration once, provided the registration info does not
change. Once you have generated a registration, you can run the app service like so:

```javascript
var AppService = require("matrix-appservice").AppService;
// listening
var as = new AppService({
  homeserverToken: "abcd653bac492087d3c87"
});
as.on("type:m.room.message", function(event) {
  // handle the incoming message
});
as.onUserQuery = function(userId, callback) {
  // handle the incoming user query then respond
  console.log("RECV %s", userId);
  callback();
};
// can also do this as a promise
as.onAliasQuery = function(alias) {
    // Needs a promise lib e.g.  var q = require("q");
    var defer = q.defer();
    // do stuff
    defer.resolve();
    return defer.promise;
};
as.listen(8010);
```

API Reference
=============

A hosted API reference can be found on [GitHub Pages](http://matrix-org.github.io/matrix-appservice-node/index.html).

