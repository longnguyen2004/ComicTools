import prompt from "prompt";
import { settings } from "./Settings.js";
import { loadExtractors } from "./Extractor.js";
import { Downloader } from "./Downloader.js";
import { resolve } from "path";
import { Logger } from "./Logger.js";

await loadExtractors();

prompt.start();

const logger = new Logger("Main");
logger.log("Current settings:", settings);
logger.log("Please input the link and output folder:");
let {link, output} = <{link: string, output: string}>await prompt.get(["link", "output"]);

if (output === "")
{
    output = resolve("./output");
    logger.log(`Using default output folder: ${output}`);
}

await Downloader.download(link, output);
