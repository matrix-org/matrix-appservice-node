module.exports.serviceName = "logging";

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
    controller.setAliasQueryResolver(aliasHandler);
    controller.addRegexPattern("aliases", "#log_.*", false);
    controller.addRegexPattern("aliases", "#logged_.*", false);
    // listen for m.room.message events to log
    controller.on("type:m.room.message", handleEvent);
};