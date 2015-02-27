module.exports.setRoutes = function(app) {
    app.get("/users/:userId", function(req, res) {
        res.send("user not implemented" + req.params.userId);
    });

    app.get("/rooms/:alias", function(req, res) {
        res.send("alias not implemented" + req.params.alias);
    });

    app.put("/transactions/:txnId", function(req, res) {
        res.send("txn not implemented" + req.params.txnId);
    });
};
