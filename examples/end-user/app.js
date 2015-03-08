var appservice = require("matrix-appservice");
var logging = require("matrix-appservice-logging");

logging.configure({
    prefixes: [""]  // log everything
});

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