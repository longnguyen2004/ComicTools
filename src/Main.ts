import prompt from "prompt";
import { settings } from "./Settings.js";
import { loadExtractors } from "./Extractor.js";
import { Downloader } from "./Downloader.js";
import { resolve } from "path";

await loadExtractors();

console.log(settings);

prompt.start();

console.log("Please input the link and output folder:");
let {link, output} = <{link: string, output: string}>await prompt.get(["link", "output"]);

if (output === "")
    output = resolve("./output");

await Downloader.download(link, output);
