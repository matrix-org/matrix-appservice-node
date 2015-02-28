var asapi = require("./asapi.js");
var AsapiController = require("./asapi-controller.js");

var asapiCtrl = new AsapiController(asapi);

module.exports.setRoutes = function(app) {
    asapi.setRoutes(app, asapiCtrl.requestHandler);

    app.get("/", function(req, res) {
        res.send("not implemented");
    });
};

module.exports.asapi = asapiCtrl;

