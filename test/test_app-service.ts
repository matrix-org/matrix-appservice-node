import { AppService } from "../src/app-service";
import { expect } from "chai";
import { Request, Response } from "express";

const HS_TOKEN = "hstoken";

function mockReq(txnId: string, body: unknown): Request {
    return {
        params: { txnId },
        query: { access_token: HS_TOKEN },
        headers: {},
        body,
    } as unknown as Request;
}

function mockRes(): Response {
    return {
        status() { return this; },
        send() { return this; },
    } as unknown as Response;
}

describe("AppService", () => {
    describe("onTransaction ephemeral events", () => {
        function receive(body: unknown): Record<string, unknown>[] {
            const appservice = new AppService({ homeserverToken: HS_TOKEN });
            const received: Record<string, unknown>[] = [];
            appservice.on("ephemeral", (ev) => received.push(ev));
            // onTransaction is private; exercise it directly with a valid token
            (appservice as unknown as { onTransaction: (req: Request, res: Response) => void })
                .onTransaction(mockReq("1", body), mockRes());
            return received;
        }

        it("emits ephemeral events sent under the stable `ephemeral` key", () => {
            const receipt = { type: "m.receipt", content: {} };
            expect(receive({ ephemeral: [receipt] })).to.deep.equal([receipt]);
        });

        it("still emits ephemeral events under the unstable MSC2409 key", () => {
            const receipt = { type: "m.receipt", content: {} };
            expect(receive({ "de.sorunome.msc2409.ephemeral": [receipt] })).to.deep.equal([receipt]);
        });

        it("prefers the stable key when both are present", () => {
            const stable = { type: "m.receipt", content: { stable: true } };
            const unstable = { type: "m.receipt", content: { stable: false } };
            expect(receive({ ephemeral: [stable], "de.sorunome.msc2409.ephemeral": [unstable] }))
                .to.deep.equal([stable]);
        });
    });
});
