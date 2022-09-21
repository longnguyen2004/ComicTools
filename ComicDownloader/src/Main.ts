import prompts from "prompts";
import { settings } from "./Settings.js";
import { loadExtractors } from "./Extractor.js";
import { Downloader } from "./Downloader.js";
import { resolve } from "path";
import { Logger } from "./Logger.js";

type MainSettings = {
    output?: string
}

const typedSettings = settings as MainSettings;

await loadExtractors();

const logger = new Logger("Main");
logger.log("Current settings:", typedSettings);
logger.log("Please input the link and output folder:");
let {link, output} = await prompts([
    {
        type: "text",
        name: "link",
        message: "Link"
    },
    {
        type: "text",
        name: "output",
        message: "Output folder",
        initial: typedSettings.output
    }
]);

if (!output)
{
    output = resolve("./output");
    logger.log(`Using default output folder: ${output}`);
}
else
{
    typedSettings.output = output;
}

await Downloader.download(link, output);
