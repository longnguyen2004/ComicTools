import type { Got } from "got-scraping";
import * as fs from "fs";

import { Info } from "./Info.js";
import { Logger } from "./Logger.js";
import { got } from "./GotInstance.js";
import cheerio from "cheerio";

const logger = new Logger("Extractor");

class Extractor
{
    got: Got;
    static siteName: string;
    static pattern?: RegExp;
    static countSubdirectories(link: string)
    {
        const { pathname } = new URL(link);
        return pathname.match(/\/[^\/]/g)?.length;
    }
    constructor(got: Got)
    {
        this.got = got;
    }
    async loadSite(link: string): Promise<[string, cheerio.Root]>
    {
        const html = await this.got(link).text();
        const $ = cheerio.load(html);
        return [html, $];
    }
    getInfo(link: string): Promise<Info> | Info
    {
        throw new Error("Extractor not implemented");
    }
}

const extractorsURL = new URL("./Extractors/", import.meta.url);

type ExtractorConstructor = (typeof Extractor)
let extractors: ExtractorConstructor[] | undefined;

async function loadExtractors()
{
    if (!extractors)
    {
        logger.log(`Loading extractors...`);
        const files = fs.readdirSync(extractorsURL)
            .filter(file => /\.js$/.test(file));
        extractors = await Promise.all(files.map(
            file => import(new URL(file, extractorsURL).toString())
                .then(module => module.default as ExtractorConstructor)
        ));
    }
    logger.log(`Loaded ${extractors.length} extractors: ${extractors.map(elem => elem.siteName).join(", ")}`);
}

function getInfo(link: string)
{
    for (const extractor of extractors!)
    {
        const pattern = extractor.pattern ?? new RegExp(extractor.siteName);
        if (pattern.test(link))
        {
            const instance = new (extractor)(got);
            return instance.getInfo(link);
        }
    }
    throw new Error("No extractors for this site");
}

export { Extractor, loadExtractors, getInfo }