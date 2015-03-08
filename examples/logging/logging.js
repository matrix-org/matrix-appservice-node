module.exports.serviceName = "logging";

var q = require("q");
var aliasPrefixes = ["log_", "logged_"];

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
    if (opts.prefixes) {
        aliasPrefixes = opts.prefixes;
    }
};

module.exports.register = function(controller) {
    controller.setAliasQueryResolver(aliasHandler);
    for (var i=0; i<aliasPrefixes.length; i++) {
        var pref = aliasPrefixes[i];
        controller.addRegexPattern("aliases", "#"+pref+".*", false);
    }
    // listen for m.room.message events to log
    controller.on("type:m.room.message", handleEvent);
};