"use strict";
var crypto = require("crypto");
var yaml = require("js-yaml");

/**
 * Construct a new application service registration.
 * @param {?Object} obj Optional. An existing registration to copy from. A deep
 * copy will be made from this object.
 * @prop {string} url The application service base URL
 * @prop {string} as_token The application service -> HS token to use.
 * @prop {string} hs_token The HS -> application service token to use.
 * @prop {string} sender The user ID localpart for the application service.
 * @prop {Object} namespaces The namespaces this application service is claiming.
 */
function AppServiceRegistration(obj) {
    obj = obj || {};
    obj = JSON.parse(JSON.stringify(obj)); // deep copy
    this.url = obj.url;
    this.as_token = obj.as_token;
    this.hs_token = obj.hs_token;
    this.sender = obj.sender;
    this.namespaces = obj.namespaces || {
        users: [],
        aliases: [],
        rooms: []
    };
}

/**
 * Generate a random token.
 * @return {string} A randomly generated token.
 */
AppServiceRegistration.prototype.generateToken = function() {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Add a regex pattern to be registered.
 * @param {String} type : The type of regex pattern. Must be 'users', 'rooms', or
 * 'aliases'.
 * @param {String} regex : The regex pattern.
 * @param {Boolean} exclusive : True to reserve the matched namespace.
 * @throws If given an invalid type or regex.
 */
AppServiceRegistration.prototype.addRegexPattern = function(type, regex, exclusive) {
    if (typeof regex != "string") {
        throw new Error("Regex must be a string");
    }
    if (["users", "aliases", "rooms"].indexOf(type) == -1) {
        throw new Error("'type' must be 'users', 'rooms' or 'aliases'");
    }

    var regexObject = {
        exclusive: Boolean(exclusive),
        regex: regex
    };

    this.namespaces[type].push(regexObject);
};

/**
 * Output this registration to the given file name.
 * @param {String} filename The file name to write the yaml to.
 * @throws If required fields hs_token, as_token, url are missing.
 */
AppServiceRegistration.prototype.outputAsYaml = function(filename) {
    if (!this.hs_token || !this.as_token || !this.url) {
        throw new Error("Missing required field(s): hs_token, as_token, url");
    }
    var reg = {
        hs_token: this.hs_token,
        as_token: this.as_token,
        namespaces: this.namespaces,
        url: this.url
    };
    if (this.sender) {
        reg.sender = this.sender; // optional
    }
    fs.writeFileSync(filename, yaml.safeDump(reg));
};

/** The application service registration class. */
module.exports = AppServiceRegistration;
