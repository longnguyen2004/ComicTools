import prompt from "prompt";
import { settings } from "./Settings.js";
import { loadExtractors } from "./Extractor.js";
import { Downloader } from "./Downloader.js";

await loadExtractors();

console.log(settings);

await Downloader.download("https://zinmanga.com/manga/ive-been-here-from-the-beginning/", "C:\\Longu")
