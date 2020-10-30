import { AppServiceRegistration } from "../src/app-service-registration"; 
import { expect } from "chai";

describe("AppServiceRegistration", () => {
    it("can construct a fresh registration file", () => {
        const reg = new AppServiceRegistration("https://example.com");
        expect(reg.getAppServiceUrl()).to.equal("https://example.com");
    });
    describe("fromObject", () => {
        it("can import minimal registration from object", () => {
            const reg = AppServiceRegistration.fromObject({
                id: "foobar",
                hs_token: "foohstoken",
                as_token: "fooastoken",
                url: "https://example.com",
                sender_localpart: "foobot",
            });
            expect(reg.getId()).to.equal("foobar");
            expect(reg.getHomeserverToken()).to.equal("foohstoken");
            expect(reg.getAppServiceToken()).to.equal("fooastoken");
            expect(reg.getAppServiceUrl()).to.equal("https://example.com");
            expect(reg.getSenderLocalpart()).to.equal("foobot");
            expect(reg.getProtocols()).to.be.null;
            expect(reg.isRateLimited()).to.be.true;
            expect(reg.pushEphemeral).to.be.undefined;
        });

        it("can import complete registration from object", () => {
            const reg = AppServiceRegistration.fromObject({
                id: "foobar",
                hs_token: "foohstoken",
                as_token: "fooastoken",
                url: "https://example.com",
                sender_localpart: "foobot",
                protocols: ["irc", "gitter"],
                "de.sorunome.msc2409.push_ephemeral": true,
                rate_limited: false,
                namespaces: {
                    users: [{
                        regex: "@foobar.+",
                        exclusive: true,
                    },{
                        regex: "@barbaz.+",
                        exclusive: false,
                    }],
                    rooms: [{
                        regex: "!foo",
                        exclusive: true,
                    }],
                    aliases: [{
                        regex: "#foo.+",
                        exclusive: true,
                    }]
                }
            });
            expect(reg.getId()).to.equal("foobar");
            expect(reg.getHomeserverToken()).to.equal("foohstoken");
            expect(reg.getAppServiceToken()).to.equal("fooastoken");
            expect(reg.getAppServiceUrl()).to.equal("https://example.com");
            expect(reg.getSenderLocalpart()).to.equal("foobot");
            expect(reg.getProtocols()).to.deep.equal(["irc", "gitter"]);
            expect(reg.isRateLimited()).to.be.false;
            expect(reg.pushEphemeral).to.be.true;
    
            expect(reg.isRoomMatch("!foo", true)).to.be.true;
    
            expect(reg.isUserMatch("@foobar1", true)).to.be.true;
            expect(reg.isUserMatch("@foobar2", false)).to.be.true;
            expect(reg.isUserMatch("@barbaz1", false)).to.be.true;
    
            expect(reg.isAliasMatch("#foo1", true)).to.be.true;
            expect(reg.isAliasMatch("#foo1", false)).to.be.true;
        });    
    });
    describe("getOutput", () => {
        it("can export minimal registration to object", () => {
            const reg = new AppServiceRegistration(null);
            reg.setId("foobar");
            reg.setHomeserverToken("foohstoken");
            reg.setAppServiceToken("fooastoken");
            reg.setSenderLocalpart("foobot");
            expect(reg.getOutput()).to.deep.equal({
                id: "foobar",
                hs_token: "foohstoken",
                as_token: "fooastoken",
                url: null,
                sender_localpart: "foobot",
            });
        });
        it("can export complete registration to object", () => {
            const reg = new AppServiceRegistration("https://example.com");
            reg.setId("foobar");
            reg.setHomeserverToken("foohstoken");
            reg.setAppServiceToken("fooastoken");
            reg.setSenderLocalpart("foobot");
            reg.setRateLimited(false);
            reg.setProtocols(["irc", "gitter"]);
            reg.pushEphemeral = true;
            reg.addRegexPattern("users", "@foobar.+", true);
            reg.addRegexPattern("users", "@barbaz.+", false);
            reg.addRegexPattern("rooms", "!foo", true);
            reg.addRegexPattern("aliases", "#foo.+", true);
            expect(reg.getOutput()).to.deep.equal({
                id: "foobar",
                hs_token: "foohstoken",
                as_token: "fooastoken",
                url: "https://example.com",
                sender_localpart: "foobot",
                protocols: ["irc", "gitter"],
                "de.sorunome.msc2409.push_ephemeral": true,
                rate_limited: false,
                namespaces: {
                    users: [{
                        regex: "@foobar.+",
                        exclusive: true,
                    },{
                        regex: "@barbaz.+",
                        exclusive: false,
                    }],
                    rooms: [{
                        regex: "!foo",
                        exclusive: true,
                    }],
                    aliases: [{
                        regex: "#foo.+",
                        exclusive: true,
                    }]
                }
            });
        });
    });
})