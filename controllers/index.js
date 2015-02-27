var asapi = require("./asapi.js");

module.exports.setRoutes = function(app) {
    asapi.setRoutes(app);
    app.get("/", function(req, res) {
        res.send("not implemented");
    });
};
