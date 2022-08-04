import { gotScraping } from "got-scraping";
import { Mutex } from "async-mutex";
import prompt from "prompt";
import pThrottle from "p-throttle";

import { Logger } from "../../Logger.js";
import { mdSettings } from "./Settings.js";
import type { Auth } from "./Schema"

const mdAuthSettings = mdSettings.auth;

const throttle = pThrottle({
    limit: 5,
    interval: 1000
})(() => {});
const gotInternal = gotScraping.extend({
    prefixUrl: "https://api.mangadex.org/",
    handlers: [
        async (options, next) => {
            await throttle();
            return next(options);
        }
    ]
});

const logger = new Logger("MangaDexAPI");
const authMutex = new Mutex();

async function _getToken()
{
    const sessionAge = 15 * 60 * 1000;
    const refreshAge = 30 * 3600 * 1000;
    const _authenticate = async () => {
        if (!("username" in mdAuthSettings && "password" in mdAuthSettings))
        {
            logger.log("Please enter your username and password");
            const { username, password } = await prompt.get(["username", "password"]);
            mdAuthSettings.username = username as string;
            mdAuthSettings.password = password as string;
        }
        const { username, password } = mdAuthSettings;
        const auth = await gotInternal.post("auth/login", {
            json: {
                username, password
            }
        }).json<Auth>();
        if (auth.result === "ok") {
            const time = Date.now();
            mdAuthSettings.token = {
                ...auth.token,
                lastAuthTime: time,
                lastRefreshTime: time
            }
            return auth.token.session;
        }
        else {
            const error = new Error();
            error.name = auth.errors.id;
            error.message = auth.errors.detail;
            throw error;
        }
    }
    const _refresh = (session: string, refresh: string) => {
        return gotInternal.post("auth/refresh", {
            headers: {
                "Authorization": "Bearer " + session
            },
            json: {
                token: refresh
            }
        }).json();
    }

    if ("token" in mdAuthSettings) {
        const { session, refresh, lastAuthTime, lastRefreshTime } = mdAuthSettings.token;
        // Token no longer valid, can we refresh?
        const time = Date.now();
        if (time > lastRefreshTime + sessionAge
            && time < lastAuthTime + refreshAge) {
            await _refresh(session, refresh);
        }
        // Can't refresh, redo authentication
        else {
            return _authenticate();
        }
        return session;
    }
    else {
        return _authenticate();
    }
}

export const MDgot = gotInternal.extend({
    handlers: [
        async (options, next) => {
            options.headers.Authorization = "Bearer " + await authMutex.runExclusive(_getToken);
            return next(options);
        }
    ]
});
