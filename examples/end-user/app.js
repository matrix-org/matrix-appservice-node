var appservice = require("../..");
var logging = require("../logging/logging.js");
var yaml = require("js-yaml");

logging.configure({
    prefixes: [""]  // log everything
});

appservice.registerService({
    service: logging,
    localpart: "my_user_id_localpart",
    http: {
        port: 3522,
        maxSize: (1024 * 1024 * 3)  // 3MB
    },
    homeserver: {
        url: "http://localhost:8008",
        token: "d2b52424827ab3c28476e3f"
    },
    appservice: {
        url: "http://localhost:3522",
        token: "1234567890"
    }
});

// return the config files which need to be put in the homeserver
appservice.getRegistration().done(function(registration) {
    console.log("===== BEGIN REGISTRATION YAML =====");
    console.log(yaml.safeDump(registration));
    console.log("===== END REGISTRATION YAML =====");
    console.log(
        "The above YAML file should be added to the destination HS config YAML"
    );
});

// actually listen on the port
appservice.runForever();