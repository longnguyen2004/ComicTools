import { gotScraping, Context } from "got-scraping";

const context: Context = {
    headerGeneratorOptions: {
        browsers: [
            {
                name: "chrome",
                minVersion: 95
            },
            {
                name: "firefox",
                minVersion: 90
            },
            {
                name: "edge",
                minVersion: 95
            }
        ],
        devices: ["desktop"],
        operatingSystems: ["windows"]
    },
    sessionToken: new Number(Date.now())
}

const got = gotScraping.extend({
    timeout: {
        request: 30000
    },
    context: context
});

export { got };