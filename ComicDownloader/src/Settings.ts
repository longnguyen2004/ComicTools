import * as fs from "fs/promises";
import pDebounce from "p-debounce";
import { Logger } from "./Logger.js";

const logger = new Logger("Settings");

interface Settings {
    chapterThrottle?: number;
    imgThrottle?: number;
}

let _fileHandle: fs.FileHandle;
let _settings: Settings = {
    chapterThrottle: 10
}

const writeSettings = pDebounce(() => {
    if (_fileHandle) {
        return _fileHandle.writeFile(JSON.stringify(_settings, (k, v) => v, 4));
    }
}, 500);

logger.log("Loading settings...");
try {
    _fileHandle = await fs.open(new URL("../settings.json", import.meta.url), "w+");
    const content = (await _fileHandle.readFile()).toString();
    if (content.length !== 0) {
        let settingsFromFile = JSON.parse(content);
        _settings = {
            ..._settings,
            ...settingsFromFile
        }
    }
}
catch (e: any) {
    if (e instanceof SyntaxError) {
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
        if (!target.hasOwnProperty(property))
            Reflect.set(target, property, {});
        return new Proxy(Reflect.get(target, property), proxyHandler)
    },
    set: function (target, property, value) {
        Reflect.set(target, property, value);
        writeSettings();
        return true;
    }
}

const settings = new Proxy(_settings, proxyHandler);

export { settings }
export type { Settings }
