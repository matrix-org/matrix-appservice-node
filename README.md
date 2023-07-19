matrix-appservice-node
======================

This is a Matrix Application Service framework written in Node.js.

This can be used to quickly setup performant application services for almost
anything you can think of in a web framework agnostic way.

If you are looking for a more fully-featured SDK for creating bridges,
you may want to check out [matrix-appservice-bridge](https://github.com/matrix-org/matrix-appservice-bridge) instead.

### Example

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
reg.setId("example-service");
reg.outputAsYaml("registration.yaml");
```

You only need to generate a registration once, provided the registration info does not
change. Once you have generated a registration, you can run the app service like so:

```javascript
import { AppService, AppserviceHttpError } from "matrix-appservice";
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

  /*
  // if this userId cannot be created, or if some error
  // conditions occur, throw AppserviceHttpError exception.
  // The underlying appservice code will send the HTTP status,
  // Matrix errorcode and error message back as a response.

  if (userCreationOrQueryFailed) {
    throw new AppserviceHttpError(
      {
        errcode: "M_FORBIDDEN",
        error: "User query or creation failed.",
      },
      403, // Forbidden, or an appropriate HTTP status
    )
  }
  */

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

A hosted API reference can be found on [GitHub Pages](https://matrix-org.github.io/matrix-appservice-node/index.html).

