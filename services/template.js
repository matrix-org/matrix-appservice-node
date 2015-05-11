/* Provides the interface required to implement a service.
 *
 * Copy and paste this template to start.
 */
"use strict";

// an informative name for this service - this will be used as a default user ID
// localpart
module.exports.serviceName = "template";  

/*
 * Called by the end user to configure this service.
 * @param {Object} opts The configuration options which can have custom
 * properties specific to this service.
 */
module.exports.configure = function(opts) {

};

/*
 * Called by the asapi-controller for this service to hook into.
 * @param {AsapiController} controller The controller to register with.
 * @param {Object} serviceConfig The config for this service, which contains:
 *   - "homeserver" {Object} : Contains "url"{String} and "token"{String}.
 *   - "appservice" {Object} : Contains "url"{String} and "token"{String}.
 *   - "port" {Number} : The port to listen on.
 *   - "localpart" {String} : (Optional) the desired AS user ID localpart.
 */
module.exports.register = function(controller, serviceConfig) {
    // Example: Handle new room aliases
    controller.addRegexPattern("aliases", "#.*", false);
    controller.setAliasQueryResolver(function(alias) {
        // TODO: Handle incoming alias query
    });

    // Set the home server token if you've stored it before. Leave blank if you
    // don't store the token.
    controller.hsToken = "d2b52424827ab3c28476e3f";

    // A callback for HTTP-level log lines.
    controller.setLogger(function(line) {
        console.log(line);
    });

    // Example: Handle messages
    controller.on("type:m.room.message", function(event) {
        // TODO: Handle this incoming event
    });

};