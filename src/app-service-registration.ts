import { randomBytes } from "crypto";
import yaml from "js-yaml";
import fs from "fs";

interface RegexObj {
    regex: string;
    exclusive: boolean;
}

export class AppServiceRegistration {

    /**
     * Generate a random token.
     * @return {string} A randomly generated token.
     */
    public static generateToken() {
        return randomBytes(32).toString('hex');
    }

        /**
     * Convert a JSON object to an AppServiceRegistration object.
     * @static
     * @param {Object} obj The registration object
     * @return {?AppServiceRegistration} The registration or null if the object
     * cannot be coerced into a registration.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static fromObject(obj: any): AppServiceRegistration|null {
        if (!obj.url) {
            return null;
        }
        const reg = new AppServiceRegistration(obj.url);
        reg.setId(obj.id);
        reg.setHomeserverToken(obj.hs_token);
        reg.setAppServiceToken(obj.as_token);
        reg.setSenderLocalpart(obj.sender_localpart);
        reg.setRateLimited(obj.rate_limited);
        reg.setProtocols(obj.protocols);
        if (obj.namespaces) {
            const kinds = ["users", "aliases", "rooms"];
            kinds.forEach((kind) => {
                if (!obj.namespaces[kind]) {
                    return;
                }
                obj.namespaces[kind].forEach((regexObj: RegexObj) => {
                    reg.addRegexPattern(
                        kind as "users"|"aliases"|"rooms", regexObj.regex, regexObj.exclusive,
                    );
                });
            });
        }
        return reg;
    }

    /**
     * Construct a new application service registration.
     * @constructor
     * @param {string} appServiceUrl The base URL the AS can be reached via.
     */
    private id: string|null = null;
    private hs_token: string|null = null;
    private as_token: string|null = null;
    private sender_localpart: string|null = null;
    private rate_limited = true;
    private namespaces: {
        users: RegexObj[];
        aliases: RegexObj[];
        rooms: RegexObj[];
    } = { users: [], aliases: [], rooms: []};
    private protocols: string[]|null = null;
    private cachedRegex: {[regextext: string]: RegExp} = {};
    constructor (private url: string) { }

    /**
     * Set the URL which the home server will hit in order to talk to the AS.
     * @param {string} url The application service url
     */
    public setAppServiceUrl(url: string) {
        this.url = url;
    }

    /**
     * Set the ID of the appservice; must be unique across the homeserver and never change.
     * @param {string} id The ID
     */
    public setId(id: string) {
        this.id = id;
    }

    /**
     * Get the ID of the appservice.
     * @return {?string} The ID
     */
    public getId() {
        return this.id;
    }

    /**
     * Set the list of protocols that this appservice will serve for third party lookups.
     * @param {string[]} protocols The protocols
     */
    public setProtocols(protocols: string[]) {
        this.protocols = protocols;
    }

    /**
     * Get the list of protocols that this appservice will serve for third party lookups.
     * Will return null if no protocols have been set.
     * @return {string[]} The protocols.
     */
    public getProtocols() {
        return this.protocols;
    }

    /**
     * Set the token the homeserver will use to communicate with the app service.
     * @param {string} token The token
     */
    public setHomeserverToken(token: string) {
        this.hs_token = token;
    }

    /**
     * Get the token the homeserver will use to communicate with the app service.
     * @return {?string} The token
     */
    public getHomeserverToken() {
        return this.hs_token;
    }

    /**
     * Set the token the app service will use to communicate with the homeserver.
     * @param {string} token The token
     */
    public setAppServiceToken(token: string) {
        this.as_token = token;
    }

    /**
     * Get the token the app service will use to communicate with the homeserver.
     * @return {?string} The token
     */
    public getAppServiceToken() {
        return this.as_token;
    }

    /**
     * Set the desired user_id localpart for the app service itself.
     * @param {string} localpart The user_id localpart ("alice" in "@alice:domain")
     */
    public setSenderLocalpart(localpart: string) {
        this.sender_localpart = localpart;
    }

    /**
     * Set whether requests from this AS are rate-limited by the home server.
     * @param {boolean} isRateLimited The flag which is set to true to enable rate
     * rate limiting, false to disable.
     */
    public setRateLimited(isRateLimited: boolean) {
        this.rate_limited = isRateLimited;
    }

    /**
     * Get the desired user_id localpart for the app service itself.
     * @return {?string} The user_id localpart ("alice" in "@alice:domain")
     */
    public getSenderLocalpart() {
        return this.sender_localpart;
    }

    /**
     * Add a regex pattern to be registered.
     * @param {String} type : The type of regex pattern. Must be 'users', 'rooms', or
     * 'aliases'.
     * @param {String} regex : The regex pattern.
     * @param {Boolean} exclusive : True to reserve the matched namespace.
     * @throws If given an invalid type or regex.
     */
    public addRegexPattern(type: "users"|"rooms"|"aliases", regex: string, exclusive?: boolean) {
        if (typeof regex != "string") {
            throw new Error("Regex must be a string");
        }
        if (["users", "aliases", "rooms"].indexOf(type) == -1) {
            throw new Error("'type' must be 'users', 'rooms' or 'aliases'");
        }

        const regexObject = {
            exclusive: Boolean(exclusive),
            regex: regex
        };

        this.namespaces[type].push(regexObject);
    }

    /**
     * Output this registration to the given file name.
     * @param {String} filename The file name to write the yaml to.
     * @throws If required fields hs_token, as_token, url are missing.
     */
    public outputAsYaml(filename: string) {
        const reg = this.getOutput();
        fs.writeFileSync(filename, yaml.safeDump(reg));
    }

    /**
     * Get the key-value output which should be written to a YAML file.
     * @return {Object}
     * @throws If required fields hs_token, as-token, url, sender_localpart are missing.
     */
    public getOutput() {
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
            rate_limited: this.rate_limited,
            protocols: this.protocols,
        };
    }

    /**
     * Check if a user_id meets this registration regex.
     * @param {string} userId The user ID
     * @param {boolean} onlyExclusive True to restrict matching to only exclusive
     * regexes. False to allow exclusive or non-exlusive regexes to match.
     * @return {boolean} True if there is a match.
     */
    public isUserMatch(userId: string, onlyExclusive: boolean) {
        return this._isMatch(this.namespaces.users, userId, onlyExclusive);
    }

    /**
     * Check if a room alias meets this registration regex.
     * @param {string} alias The room alias
     * @param {boolean} onlyExclusive True to restrict matching to only exclusive
     * regexes. False to allow exclusive or non-exlusive regexes to match.
     * @return {boolean} True if there is a match.
     */
    public isAliasMatch(alias: string, onlyExclusive: boolean) {
        return this._isMatch(this.namespaces.aliases, alias, onlyExclusive);
    }

    /**
     * Check if a room ID meets this registration regex.
     * @param {string} roomId The room ID
     * @param {boolean} onlyExclusive True to restrict matching to only exclusive
     * regexes. False to allow exclusive or non-exlusive regexes to match.
     * @return {boolean} True if there is a match.
     */
    public isRoomMatch(roomId: string, onlyExclusive: boolean) {
        return this._isMatch(this.namespaces.rooms, roomId, onlyExclusive);
    }

    public _isMatch(regexList: RegexObj[], sample: string, onlyExclusive: boolean) {
        onlyExclusive = Boolean(onlyExclusive);
        for (const regexObj of regexList) {
            let regex = this.cachedRegex[regexObj.regex];
            if (!regex) {
                regex = new RegExp(regexObj.regex);
                this.cachedRegex[regexObj.regex] = regex;
            }
            if (regex.test(sample)) {
                if (onlyExclusive && !regexObj.exclusive) {
                    continue;
                }
                return true;
            }
        }
        return false;
    }
}

