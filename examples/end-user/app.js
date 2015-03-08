var appservice = require("matrix-appservice");
var logging = require("matrix-appservice-logging");

appservice.registerServices([
{
    service: logging,
    hs: "http://localhost:8008",
    token: "1234567890",
    as: "http://localhost:3500",
    port: 3500
},
{
    service: logging,
    hs: "http://localhost:8008",
    token: "1234567890abc",
    as: "http://localhost:3502",
    port: 3502
}
]);
appservice.runForever();