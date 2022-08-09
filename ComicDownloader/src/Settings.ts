import * as fs from "fs/promises";
import pDebounce from "p-debounce";
import { Logger } from "./Logger.js";

const logger = new Logger("Settings");

interface Settings {
    chapterThrottle?: number;
    imgThrottle?: number;
    [k: string]: unknown;
}

let _settings: Settings = {
    chapterThrottle: 10
}

const settingsUrl = new URL("../settings.json", import.meta.url);

const writeSettings = pDebounce(() => fs.writeFile(settingsUrl, JSON.stringify(_settings, (k, v) => v, 4)), 500);

logger.log("Loading settings...");
try {
    const content = (await fs.readFile(settingsUrl)).toString();
    if (content.length !== 0) {
        let settingsFromFile = JSON.parse(content);
        _settings = {
            ..._settings,
            ...settingsFromFile
        }
    }
}
catch (e: any) {
    if (e.code === "ENOENT")
    {
        // Do nothing here
    }
    else if (e instanceof SyntaxError) {
        logger.warn("Invalid JSON, overwriting with default values");
    }
    else {
        logger.error("Error opening settings file, your settings will not be saved");
    }
}
await writeSettings();

const proxyHandler: ProxyHandler<Record<string, unknown>> = {
    get: function (target, property)
    {
        const value = Reflect.get(target, property);
        if (target.hasOwnProperty(property) && value instanceof Object)
            return new Proxy(value, proxyHandler);
        else
            return value;
    },
    set: function (target, property, value) {
        Reflect.set(target, property, value);
        writeSettings();
        return true;
    }
}

const settings: Settings = new Proxy(_settings, proxyHandler);

export { settings }
export type { Settings }
