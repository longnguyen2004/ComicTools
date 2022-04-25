import { gotScraping, Context } from "got-scraping";

const context: Context = {
    headerGeneratorOptions: {
        browsers: [
            {
                name: "chrome",
                minVersion: 90
            },
            {
                name: "firefox",
                minVersion: 90
            }
        ],
        devices: ["desktop"]
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