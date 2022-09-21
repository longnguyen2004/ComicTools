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
            throw new Error(auth.errors.detail);
        }
    }
    const _refresh = async (session: string, refresh: string) => {
        const res = await gotInternal.post("auth/refresh", {
            headers: {
                "Authorization": "Bearer " + session
            },
            json: {
                token: refresh
            }
        }).json();
        mdAuthSettings.token.lastRefreshTime = Date.now();
        return res;
    }

    if ("token" in mdAuthSettings) {
        const { session, refresh, lastAuthTime, lastRefreshTime } = mdAuthSettings.token;
        const time = Date.now();
        // Token no longer valid
        if (time > lastRefreshTime + sessionAge)
        {
            // Do we need to reauth?
            if (time > lastAuthTime + refreshAge)
                return _authenticate();
            else
                await _refresh(session, refresh);
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
