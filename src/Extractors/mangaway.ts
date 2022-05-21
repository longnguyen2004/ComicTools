import { Info, ChapterInfo, MangaInfo } from "../Info.js";
import { Extractor } from "../Extractor.js";

export default class mangaway extends Extractor
{
    static siteName = "mangaway";
    static pattern = /mangaway\.xyz\/manga_.+?(\/read)?/;
    async getChapter(link: string): Promise<ChapterInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = "Chap " + new URL(link).searchParams.get("page");
        const img = $("div[data-nanogallery2] a").map((_, elem) => $(elem).attr("href")).get() as string[];
        return {
            type: "chapter",
            title: title,
            img: img,
        }
    }
    async getManga(link: string): Promise<MangaInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = $("span[itemprop='name']").text();
        const chapter = $("#chaptersTable tbody tr td a").map((_, elem) => "https://mangaway.xyz" + $(elem).attr("href")).get() as string[];
        return {
            type: "full",
            title: title,
            chapter: chapter.map(link => () => this.getChapter(link)),
        }
    }
    getInfo(link: string): Promise<Info>
    {
        return link.includes("/read") ? this.getChapter(link) : this.getManga(link);
    }
}