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
    token: "1234567890",
    as: "http://localhost:3522",
    port: 3522
}
]);

// return the config files which need to be put in the homeserver
appservice.getConfigFiles().done(function(entries) {
    entries.forEach(function(c) {
        console.log("===== BEGIN CONFIG FILE =====");
        console.log(yaml.safeDump(c));
        console.log("===== END CONFIG FILE =====");
        console.log(
            "The above YAML file should be added to the destination HS config YAML"
        );
    });
});

// actually listen on the port
appservice.runForever();