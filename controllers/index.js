var asapi = require("../api/asapi.js");
var AsapiController = require("./asapi-controller.js");

var asapiCtrl = new AsapiController(asapi);

/*
 * Sets up routes for the provided app.
 */
module.exports.setRoutes = function(app) {
    asapi.setRoutes(app, asapiCtrl.requestHandler);

    app.get("/", function(req, res) {
        res.send("not implemented");
    });
};

module.exports.asapi = asapiCtrl;

