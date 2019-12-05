import {Application, Request, Response, default as express} from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import util from "util";
import { EventEmitter } from "events";
import fs from "fs";
import https from "https";
import { Server } from "http";

const MAX_SIZE_BYTES = 5000000; // 5MB

export class AppService extends EventEmitter {
    /**
     * An HTTP log line.
     * @event AppService#http-log
     * @type {String}
     * @example
     * appService.on("http-log", function(logLine) {
     *   console.log(logLine);
     * });
     */

    /**
     * An incoming Matrix JSON event.
     * @event AppService#event
     * @type {Object}
     * @example
     * appService.on("event", function(ev) {
     *   console.log("ID: %s", ev.event_id);
     * });
     */
   
    /**
     * An incoming Matrix JSON event, filtered by <code>event.type</code>
     * @event AppService#type:event
     * @type {Object}
     * @example
     * appService.on("type:m.room.message", function(ev) {
     *   console.log("Body: %s", ev.content.body);
     * });
     */

    private app: Application;
    private server?: Server;
    private lastProcessedTxnId = "";
    /**
     * Construct a new application service.
     * @constructor
     * @param {Object} config Configuration for this service.
     * @param {String} config.homeserverToken The incoming HS token to expect. Must
     * be set prior to calling listen(port).
     * @param {Number} config.httpMaxSizeBytes The max number of bytes allowed on an
     * incoming HTTP request. Default: 5000000.
     * @throws If a homeserver token is not supplied.
     */
    constructor (private config: { homeserverToken: string; httpMaxSizeBytes?: number}) {
        super();
        const app = express();
        app.use(morgan("combined", {
            stream: {
                write: this.onMorganLog.bind(this),
            }
        }));

        app.use(bodyParser.json({
            limit: this.config.httpMaxSizeBytes || MAX_SIZE_BYTES,
        }));

        app.get("/_matrix/app/v1/users/:userId", this.onGetUsers.bind(this));
        app.get("/_matrix/app/v1/rooms/:alias", this.onGetRoomAlias.bind(this));
        app.put("/_matrix/app/v1/transactions/:txnId", this.onTransaction.bind(this));
        app.get("/users/:userId", this.onGetUsers.bind(this));
        app.get("/rooms/:alias", this.onGetRoomAlias.bind(this));
        app.put("/transactions/:txnId", this.onTransaction.bind(this));

        this.app = app;
    }

    /***
     * Begin listening on the specified port.
     * @param {Number} port The port to listen on.
     * @param {String} hostname Optional hostname to listen on
     * @param {Number} backlog Maximum length of the queue of pending connections
     * @param {Function} callback The callback for the "listening" event. Optional.
     * @returns {Promise} When the server is listening, if a callback is not provided.
     */
    public listen(port: number, hostname: string, backlog: number, callback?: () => void) {
        const tlsKey = process.env.MATRIX_AS_TLS_KEY;
        const tlsCert = process.env.MATRIX_AS_TLS_CERT;
        let serverApp: Server|Application;
        if (tlsKey || tlsCert) {
            if (!(tlsKey && tlsCert)) {
                throw new Error("MATRIX_AS_TLS_KEY and MATRIX_AS_TLS_CERT should be defined together!");
            }

            if (!fs.existsSync(tlsKey)) {
                throw new Error("Could not open MATRIX_AS_TLS_KEY: " + tlsKey);
            }

            if (!fs.existsSync(tlsCert)) {
                throw new Error("Could not open MATRIX_AS_TLS_CERT: " + tlsCert);
            }

            const options = {
                key  : fs.readFileSync(tlsKey),
                cert : fs.readFileSync(tlsCert)
            };
            serverApp = https.createServer(options, this.app);
        }
        else {
            serverApp = this.app;
        }
        if (callback) {
            this.server = serverApp.listen(port, hostname, backlog, callback);
            return;
        }
        return new Promise((resolve, reject) => {
            this.server = serverApp.listen(port, hostname, backlog, (err: Error|null) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Closes the HTTP server.
     * @returns {Promise} When the operation has completed
     * @throws If the server has not been started.
     */
    public async close() {
        if (!this.server) {
            throw Error("Server has not started");
        }
        return util.promisify(this.server.close).apply(this.server);
    }


    /**
     * Override this method to handle alias queries.
     * @param {string} alias The queried room alias
     * @param {Function} callback The callback to invoke when complete.
     * @return {Promise} A promise to resolve when complete (if callback isn't supplied)
     */
    public onAliasQuery(alias: string, callback: () => void): PromiseLike<void>|null {
        callback(); // stub impl
        return null;
    }

    /**
     * Override this method to handle user queries.
     * @param {string} userId The queried user ID.
     * @param {Function} callback The callback to invoke when complete.
     * @return {Promise} A promise to resolve when complete (if callback isn't supplied)
     */
    public onUserQuery(userId: string, callback: () => void): PromiseLike<void>|null {
        callback(); // stub impl
        return null;
    }

    /**
     * Set the token that should be used to verify incoming events.
     * @param {string} hsToken The home server token
     */
    public setHomeserverToken(hsToken: string) {
        this.config.homeserverToken = hsToken;
    }

    private onMorganLog(str: string) {
        const redactedStr = str.replace(/access_token=.*?(&|\s|$)/, "access_token=<REDACTED>$1");
        this.emit("http-log", redactedStr);
    }

    private isInvalidToken(req: Request, res: Response): boolean {
        const providedToken = req.query.access_token;
        if (providedToken !== this.config.homeserverToken) {
            res.send({
                errcode: "M_FORBIDDEN",
                error: "Bad token supplied,"
            });
            return true;
        }
        return false;
    }

    private async onGetUsers(req: Request, res: Response) {
        if (this.isInvalidToken(req, res)) {
            return;
        }
        const possiblePromise = this.onUserQuery(req.params.userId, () => {
            res.send({});
        });
        if (!possiblePromise) {
            return;
        }
        try {
            await possiblePromise;
            res.send({});
        } catch (e) {
            res.send({
                errcode: "M_UNKNOWN",
                error: e ? e.message : ""
            });
        }
    }

    private async onGetRoomAlias(req: Request, res: Response) {
        if (this.isInvalidToken(req, res)) {
            return;
        }
        const possiblePromise = this.onAliasQuery(req.params.alias, function() {
            res.send({});
        });
        if (!possiblePromise) { 
            return;
        }
        try {
            await possiblePromise;
            res.send({});
        } catch (e) {
            res.send({
                errcode: "M_UNKNOWN",
                error: e ? e.message : ""
            });
        }
    }

    private onTransaction(req: Request, res: Response) {
        if (this.isInvalidToken(req, res)) {
            return;
        }

        const txnId = req.params.txnId;
        if (!txnId) {
            res.send("Missing transaction ID.");
            return;
        }
        if (!req.body || !req.body.events) {
            res.send("Missing events body.");
            return;
        }
        const events = req.body.events;

        if (this.lastProcessedTxnId === txnId) {
            res.send({}); // duplicate
            return;
        }
        for (const event of events) {
            this.emit("event", event);
            if (event.type) {
                this.emit("type:" + event.type, event);
            }
        }
        this.lastProcessedTxnId = txnId;
        res.send({});
    }
}
