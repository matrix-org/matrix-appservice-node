/* Provides the interface required to implement a service.
 *
 * Copy and paste this template to start.
 */
"use strict";

// an informative name for this service
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
 */
module.exports.register = function(controller) {
    // Example: Handle new room aliases
    controller.addRegexPattern("aliases", "#.*", false);
    controller.setAliasQueryResolver(function(alias) {
        // TODO: Handle incoming alias query
    });

    // Example: Handle messages
    controller.on("type:m.room.message", function(event) {
        // TODO: Handle this incoming event
    });

};