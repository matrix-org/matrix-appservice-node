/* Logging Service
 * @name org.matrix.logging
 * @aliases_ex #log_.*
 * @description Logs chat in rooms with an alias starting #log_
 */
 var q = require("q");
 var NAME = "org.matrix.logging";
 var ALIASES = "#log_.*";

var aliasHandler = function(roomAlias) {
    // createRoom
    // return YEP
    console.log("loggingService: Receive new room '%s'", roomAlias);
    return q("loggingService: yep");
};


module.exports.register = function(app, controller) {
    controller.addQueryHandler({
        name: NAME,
        type: "aliases",
        regex: ALIASES
    }, aliasHandler);

    // TODO listen for m.room.message events to log
};