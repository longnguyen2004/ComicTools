// Super thankful that they have a proper API ^^

import { MangaInfo, ChapterInfo } from "../../Info.js";
import { Extractor } from "../../Extractor.js";
import { Logger } from "../../Logger.js";
import { MDgot } from "./MangaDexGot.js"
import type * as MD from "./Schema";
import { mdSettings } from "./Settings.js";

const logger = new Logger("mangadex");

export default class mangadex extends Extractor
{
    static siteName = "mangadex";
    static pattern = /mangadex\.org\/(?<type>title|chapter)\/(?<uuid>[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/
    constructor()
    {
        super(MDgot);
        if (!("languages" in mdSettings)) mdSettings.languages = ["en", "ja", "kr"];
    }
    async _getChapter(uuid: string): Promise<ChapterInfo>
    {
        const info = await this.got(`chapter/${uuid}`).json() as MD.ChapterInfo;
        if (info.result === "error") throw new Error("Something happened");

        const { volume, chapter, title } = info.data.attributes;
        const finalTitle = `Vo.${volume} Ch.${chapter} ${title}`;
        
        const atHome = await this.got(`at-home/server/${uuid}`).json() as MD.AtHomeInfo;
        if (atHome.result === "error") throw new Error("Something happened");
        const { baseUrl } = atHome;
        const { hash, data } = atHome.chapter;
        return {
            type: "chapter",
            title: finalTitle,
            img: data.map(elem => `${baseUrl}/data/${hash}/${elem}`)
        }
    }
    async _getManga(uuid: string): Promise<MangaInfo>
    {
        logger.log(`[mangadex] API call: manga/${uuid}`);
        const info = await this.got(`manga/${uuid}`).json() as MD.MangaInfo;
        if (info.result === "error") throw new Error("Something happened");

        logger.log(`[mangadex] API call: manga/${uuid}/aggregate`);
        const chapterList = await this.got(`manga/${uuid}/aggregate`, {
            searchParams: new URLSearchParams(mdSettings.languages.map(
                elem => ["translatedLanguage[]", elem]
            ) as [string, string][])
        }).json() as MD.MangaAggregate;
        if (chapterList.result === "error") throw new Error("Something happened");

        const { title: titleObj } = info.data.attributes;
        const titleLang = mdSettings.languages.find((elem) => Object.keys(titleObj).includes(elem));
        const title = titleLang ? titleObj[titleLang as MD.LanguageCode] : Object.values(titleObj)[0];

        const chapterId = Object.values(chapterList.volumes).map(
            elem => Object.values(elem.chapters).map(
                elem => elem.id
            )
        ).flat();

        return {
            type: "full",
            title,
            chapter: chapterId.map(elem => () => this._getChapter(elem))
        }
    }
    async getInfo(link: string): Promise<MangaInfo | ChapterInfo>
    {
        const {type, uuid} = link.match(mangadex.pattern)!.groups!;
        return type === "title" ? this._getManga(uuid) : this._getChapter(uuid);
    }
}