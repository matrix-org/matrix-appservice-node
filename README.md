This is a Matrix Application Service framework written in Node.js.

This can be used to quickly setup performant application services for almost 
anything you can think of in a web framework agnostic way.

``` javascript
var AppService = require("matrix-appservice").AppService;
var AppServiceRegistration = require("matrix-appservice").AppServiceRegistration;

// creating registration files
var reg = new AppServiceRegistration("http://localhost:8010");
reg.setHomeserverToken(AppServiceRegistration.generateToken());
reg.setAppServiceToken(AppServiceRegistration.generateToken());
reg.addRegexPattern("users", "@.*", true);
reg.outputAsYaml("registration.yaml");

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
as.listen(8010);
```

API Reference
=============

A hosted API reference can be found on GitHub Pages.

