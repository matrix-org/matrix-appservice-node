var q = require("q");

var aliasHandler = function(roomAlias) {
    console.log("loggingService: Receive new room '%s'", roomAlias);
    // TODO: Handle room alias query
    return q.reject({});
};

var handleEvent = function(event) {
    console.log("RECV %s", JSON.stringify(event));
};

module.exports.configure = function(opts) {
    // TODO: Any configuration handling (e.g. logging format)  
};

module.exports.register = function(controller) {
    controller.addQueryHandler({
        name: "logging-service(arbitrary-string)",
        type: "aliases",
        regex: "#log_.*",
        exclusive: false
    }, aliasHandler);
    // listen for m.room.message events to log
    controller.on("type:m.room.message", handleEvent);
};