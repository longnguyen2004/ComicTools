import type { Got } from "got-scraping";
import { Info } from "./Info.js";
import { Logger } from "./Logger.js";
import { got } from "./GotInstance.js";
import { globbySync } from "globby";
import cheerio from "cheerio";

const logger = new Logger("Extractor");

class Extractor
{
    got: Got;
    logger: Logger;
    static siteName: string | string[];
    static pattern?: RegExp;
    static countSubdirectories(link: string)
    {
        const { pathname } = new URL(link);
        return pathname.match(/\/[^\/]/g)?.length;
    }
    constructor(got: Got)
    {
        this.got = got;
        this.logger = new Logger(this.constructor.name);
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
        const files = globbySync([
            "./*.js",
            "./*/index.js"
        ], { cwd: extractorsURL })
            .filter(file => /\.js$/.test(file));
        extractors = await Promise.all(files.map(
            file => import(new URL(file, extractorsURL).toString())
                .then(module => module.default as ExtractorConstructor)
        ));
    }
    logger.log(`Loaded ${extractors.length} extractors`);
    logger.log(`Supported site: ${extractors.map(elem => elem.siteName).flat().sort().join(", ")}`);
}

function getInfo(link: string)
{
    for (const extractor of extractors!)
    {
        let regexFromSiteName;
        if (extractor.siteName instanceof Array)
        {
            regexFromSiteName = extractor.siteName.join("|");
        }
        else
        {
            regexFromSiteName = extractor.siteName;
        }
        const pattern = extractor.pattern ?? new RegExp(regexFromSiteName);
        if (pattern.test(link))
        {
            const instance = new (extractor)(got);
            return instance.getInfo(link);
        }
    }
    throw new Error("No extractors for this site");
}

export { Extractor, loadExtractors, getInfo }