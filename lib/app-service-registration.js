"use strict";
var crypto = require("crypto");
var yaml = require("js-yaml");
var fs = require("fs");

/**
 * Construct a new application service registration.
 * @constructor
 * @param {string} appServiceUrl The base URL the AS can be reached via.
 */
function AppServiceRegistration(appServiceUrl) {
    this.url = appServiceUrl;
    this.id = null;
    this.hs_token = null;
    this.as_token = null;
    this.sender_localpart = null;
    this.rate_limited = true;
    this.namespaces = {
        users: [],
        aliases: [],
        rooms: []
    };
    this._cachedRegex = {};
}

/**
 * Generate a random token.
 * @return {string} A randomly generated token.
 */
AppServiceRegistration.generateToken = function() {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Set the URL which the home server will hit in order to talk to the AS.
 * @param {string} url The application service url
 */
AppServiceRegistration.prototype.setAppServiceUrl = function(url) {
    this.url = url;
};

/**
 * Set the ID of the appservice; must be unique across the homeserver and never change.
 * @param {string} id The ID
 */
AppServiceRegistration.prototype.setId = function(id) {
    this.id = id;
};

/**
 * Get the ID of the appservice.
 * @return {?string} The ID
 */
AppServiceRegistration.prototype.getId = function() {
    return this.id;
};

/**
 * Set the token the homeserver will use to communicate with the app service.
 * @param {string} token The token
 */
AppServiceRegistration.prototype.setHomeserverToken = function(token) {
    this.hs_token = token;
};

/**
 * Get the token the homeserver will use to communicate with the app service.
 * @return {?string} The token
 */
AppServiceRegistration.prototype.getHomeserverToken = function() {
    return this.hs_token;
};

/**
 * Set the token the app service will use to communicate with the homeserver.
 * @param {string} token The token
 */
AppServiceRegistration.prototype.setAppServiceToken = function(token) {
    this.as_token = token;
};

/**
 * Get the token the app service will use to communicate with the homeserver.
 * @return {?string} The token
 */
AppServiceRegistration.prototype.getAppServiceToken = function() {
    return this.as_token;
};

/**
 * Set the desired user_id localpart for the app service itself.
 * @param {string} localpart The user_id localpart ("alice" in "@alice:domain")
 */
AppServiceRegistration.prototype.setSenderLocalpart = function(localpart) {
    this.sender_localpart = localpart;
};

/**
 * Set whether requests from this AS are rate-limited by the home server.
 * @param {boolean} isRateLimited The flag which is set to true to enable rate
 * rate limiting, false to disable.
 */
AppServiceRegistration.prototype.setRateLimited = function(isRateLimited) {
    this.rate_limited = isRateLimited;
};

/**
 * Get the desired user_id localpart for the app service itself.
 * @return {?string} The user_id localpart ("alice" in "@alice:domain")
 */
AppServiceRegistration.prototype.getSenderLocalpart = function() {
    return this.sender_localpart;
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
    var reg = this.getOutput();
    fs.writeFileSync(filename, yaml.safeDump(reg));
};

/**
 * Get the key-value output which should be written to a YAML file.
 * @return {Object}
 * @throws If required fields hs_token, as-token, url, sender_localpart are missing.
 */
AppServiceRegistration.prototype.getOutput = function() {
    if (!this.id || !this.hs_token || !this.as_token || !this.url || !this.sender_localpart) {
        throw new Error(
            "Missing required field(s): id, hs_token, as_token, url, sender_localpart"
        );
    }
    return {
        id: this.id,
        hs_token: this.hs_token,
        as_token: this.as_token,
        namespaces: this.namespaces,
        url: this.url,
        sender_localpart: this.sender_localpart,
        rate_limited: this.rate_limited
    };
};

/**
 * Check if a user_id meets this registration regex.
 * @param {string} userId The user ID
 * @param {boolean} onlyExclusive True to restrict matching to only exclusive
 * regexes. False to allow exclusive or non-exlusive regexes to match.
 * @return {boolean} True if there is a match.
 */
AppServiceRegistration.prototype.isUserMatch = function(userId, onlyExclusive) {
    return this._isMatch(this.namespaces.users, userId, onlyExclusive);
};

/**
 * Check if a room alias meets this registration regex.
 * @param {string} alias The room alias
 * @param {boolean} onlyExclusive True to restrict matching to only exclusive
 * regexes. False to allow exclusive or non-exlusive regexes to match.
 * @return {boolean} True if there is a match.
 */
AppServiceRegistration.prototype.isAliasMatch = function(alias, onlyExclusive) {
    return this._isMatch(this.namespaces.aliases, alias, onlyExclusive);
};

/**
 * Check if a room ID meets this registration regex.
 * @param {string} roomId The room ID
 * @param {boolean} onlyExclusive True to restrict matching to only exclusive
 * regexes. False to allow exclusive or non-exlusive regexes to match.
 * @return {boolean} True if there is a match.
 */
AppServiceRegistration.prototype.isRoomMatch = function(roomId, onlyExclusive) {
    return this._isMatch(this.namespaces.rooms, roomId, onlyExclusive);
};

/**
 * Convert a JSON object to an AppServiceRegistration object.
 * @static
 * @param {Object} obj The registration object
 * @return {?AppServiceRegistration} The registration or null if the object
 * cannot be coerced into a registration.
 */
AppServiceRegistration.fromObject = function(obj) {
    if (!obj.url) {
        return null;
    }
    var reg = new AppServiceRegistration(obj.url);
    reg.setId(obj.id);
    reg.setHomeserverToken(obj.hs_token);
    reg.setAppServiceToken(obj.as_token);
    reg.setSenderLocalpart(obj.sender_localpart);
    reg.setRateLimited(obj.rate_limited);
    if (obj.namespaces) {
        var kinds = ["users", "aliases", "rooms"];
        kinds.forEach(function(kind) {
            if (!obj.namespaces[kind]) {
                return;
            }
            obj.namespaces[kind].forEach(function(regexObj) {
                reg.addRegexPattern(
                    kind, regexObj.regex, regexObj.exclusive
                );
            });
        });
    }
    return reg;
};

AppServiceRegistration.prototype._isMatch = function(regexList, sample, onlyExclusive) {
    onlyExclusive = Boolean(onlyExclusive);
    for (var i = 0; i < regexList.length; i++) {
        var regex = this._cachedRegex[regexList[i].regex];
        if (!regex) {
            regex = new RegExp(regexList[i].regex);
            this._cachedRegex[regexList[i].regex] = regex;
        }
        if (regex.test(sample)) {
            if (onlyExclusive && !regexList[i].exclusive) {
                continue;
            }
            return true;
        }
    }
    return false;
}

/** The application service registration class. */
module.exports = AppServiceRegistration;
