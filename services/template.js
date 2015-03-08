/* Provides the interface required to implement a service.
 *
 * Copy and paste this template to start.
 */
"use strict";

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
    controller.addQueryHandler({
        name: "example-service",
        type: "aliases",
        regex: "#.*",
        exclusive: false
    }, function(alias) {
        // TODO: do something with this alias query
    });

    // Example: Handle messages
    controller.on("type:m.room.message", function(event) {
        // TODO: Handle this incoming event
    });

};