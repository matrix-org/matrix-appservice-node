var appservice = require("../..");
var logging = require("../logging/logging.js");
var yaml = require("js-yaml");

logging.configure({
    prefixes: [""]  // log everything
});

appservice.registerServices([
{
    service: logging,
    hs: "http://localhost:8008",
    hsToken: "d2b52424827ab3c28476e3f",
    token: "1234567890",
    as: "http://localhost:3522",
    port: 3522
}
]);

// return the config files which need to be put in the homeserver
appservice.getRegistrations().done(function(entries) {
    entries.forEach(function(c) {
        console.log("===== BEGIN REGISTRATION YAML =====");
        console.log(yaml.safeDump(c));
        console.log("===== END REGISTRATION YAML =====");
        console.log(
            "The above YAML file should be added to the destination HS config YAML"
        );
    });
});

// actually listen on the port
appservice.runForever();