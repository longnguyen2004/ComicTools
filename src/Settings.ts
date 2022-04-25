import * as fs from "fs/promises";
import pDebounce from "p-debounce";
import { Logger } from "./Logger.js";

const logger = new Logger("Settings");

interface Settings {
    chapterThrottle?: number;
    imgThrottle?: number;
    [key: string]: unknown;
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
        await writeSettings();
    }
}
catch (e: any) {
    if (e instanceof SyntaxError) {
        logger.log("Invalid JSON, overwriting with default values", Logger.Severity.WARNING);
    }
    else {
        logger.log("Error opening settings file, your settings will not be saved", Logger.Severity.ERROR);
    }
}
await writeSettings();

const settings = new Proxy(_settings, {
    set: function (target, property, value) {
        Reflect.set(target, property, value);
        writeSettings();
        return true;
    }
})

export { settings }