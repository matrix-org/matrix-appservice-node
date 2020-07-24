This is a Matrix Application Service framework written in Node.js.

This can be used to quickly setup performant application services for almost 
anything you can think of in a web framework agnostic way.

To create an app service registration file:
```javascript
const { AppServiceRegistration } = require("matrix-appservice");

// creating registration files
const reg = new AppServiceRegistration();
reg.setAppServiceUrl("http://localhost:8010");
reg.setHomeserverToken(AppServiceRegistration.generateToken());
reg.setAppServiceToken(AppServiceRegistration.generateToken());
reg.setSenderLocalpart("example-appservice");
reg.addRegexPattern("users", "@.*", true);
reg.setProtocols(["exampleservice"]); // For 3PID lookups
reg.outputAsYaml("registration.yaml");
```

You only need to generate a registration once, provided the registration info does not
change. Once you have generated a registration, you can run the app service like so:

```javascript
const { AppService } = require("matrix-appservice");
// listening
const as = new AppService({
  homeserverToken: "abcd653bac492087d3c87"
});
as.on("type:m.room.message", (event) => {
  // handle the incoming message
});
as.onUserQuery = function(userId, callback) {
  // handle the incoming user query then respond
  console.log("RECV %s", userId);
  callback();
};
// can also do this as a promise
as.onAliasQuery = async function(alias) {
  console.log("RECV %s", alias);
};
as.listen(8010);
```

### TLS Connections

If `MATRIX_AS_TLS_KEY` and `MATRIX_AS_TLS_CERT` environment variables are
defined and point to valid tls key and cert files, the AS will listen using
an HTTPS listener.

### API Reference

A hosted API reference can be found on [GitHub Pages](http://matrix-org.github.io/matrix-appservice-node/index.html).

