import {Application, Request, Response, default as express} from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import util from "util";
import { EventEmitter } from "events";
import fs from "fs";
import https from "https";
import { Server, default as http } from "http";

const MAX_SIZE_BYTES = 5000000; // 5MB

export declare interface AppService {
    /**
     * Emitted when an event is pushed to the appservice.
     * The format of the event object is documented at
     * https://matrix.org/docs/spec/application_service/r0.1.2#put-matrix-app-v1-transactions-txnid
     * @event
     * @example
     * appService.on("event", function(ev) {
     *   console.log("ID: %s", ev.event_id);
     * });
     */
    on(event: "event", cb: (event: Record<string, unknown>) => void): this;
    /**
     * Emitted when an ephemeral event is pushed to the appservice.
     * The format of the event object is documented at
     * https://github.com/matrix-org/matrix-doc/pull/2409
     * @event
     * @example
     * appService.on("ephemeral", function(ev) {
     *   console.log("ID: %s", ev.type);
     * });
     */
    on(event: "ephemeral", cb: (event: Record<string, unknown>) => void): this;
    /**
     * Emitted when the HTTP listener logs some information.
     * `access_tokens` are stripped from requests
     * @event
     * @example
     * appService.on("http-log", function(line) {
     *   console.log(line);
     * });
     */
    on(event: "http-log", cb: (line: string) => void): this;
    /**
     * Emitted when an event of a particular type is pushed
     * to the appservice. This will be emitted *in addition*
     * to "event", so ensure your bridge deduplicates events.
     * @event
     * @param event Should start with "type:"
     * @example
     * appService.on("type:m.room.message", function(event) {
     *   console.log("ID: %s", ev.content.body);
     * });
     */
    on(event: string, cb: (event: Record<string, unknown>) => void): this;
}

export class AppService extends EventEmitter {
    /**
     * @deprecated Use `AppService.expressApp`
     */
    public readonly app: Application;
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
        app.get("/health", this.onHealthCheck.bind(this));

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
        let serverApp: Server;
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
            serverApp = http.createServer({}, this.app);
        }
        if (callback) {
            this.server = serverApp.listen(port, hostname, backlog, callback);
            return;
        }
        return new Promise((resolve, reject) => {
            serverApp.on("error", (err) => {
                reject(err)
            });
            serverApp.on("listening", () => {
                resolve();
            });
            this.server = serverApp.listen(port, hostname, backlog);
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

    /**
     * The Express App instance for the appservice, which
     * can be extended with paths.
     */
    public get expressApp() {
        return this.app;
    }

    private onMorganLog(str: string) {
        const redactedStr = str.replace(/access_token=.*?(&|\s|$)/, "access_token=<REDACTED>$1");
        this.emit("http-log", redactedStr);
    }

    private isInvalidToken(req: Request, res: Response): boolean {
        const providedToken = req.query.access_token;
        if (providedToken !== this.config.homeserverToken) {
            res.status(403);
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
        if (!req.body) {
            res.send("Missing body.");
            return;
        }

        const events = req.body.events || [];
        const ephemeral = req.body["de.sorunome.msc2409.ephemeral"] || [];

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
        for (const event of ephemeral) {
            this.emit("ephemeral", event);
            if (event.type) {
                this.emit("ephemeral_type:" + event.type, event);
            }
        }
        this.lastProcessedTxnId = txnId;
        res.send({});
    }

    private onHealthCheck(req: Request, res: Response) {
        res.send('OK');
    }
}
