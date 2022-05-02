import { Info, MangaInfo, ChapterInfo } from "../Info.js";
import { Extractor } from "../Extractor.js";

export default class fuhuz extends Extractor
{
    static siteName = "fuhuz";
    static pattern = /fuhuz\.com\/comic(-chapter)?\/.+/;
    async getChapter(link: string): Promise<ChapterInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = $(".item-detail__subtitle").text();
        // It's not like they have many servers anyway, can change in the future tho
        const servers = $(".item-detail__servers-list > div > a").map((_, elem) => $(elem).attr("href")).get()[0];
        const [_content, $content] = await this.loadSite(servers);
        const imgJson = JSON.parse(_content.match(/var servers=({.+?});/)![1]);
        return {
            type: "chapter",
            title: title,
            img: (imgJson.sv1.webp as string[][]).flat(),
            downloadOptions: {
                headers: {
                    referer: "https://idoitmyself.xyz/"
                }
            }
        }
    }
    async getManga(link: string): Promise<MangaInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = $(".item-detail__title").text();
        const chapter = $(".cscroller > .subitem-item > div > div > a").map((_, elem) => $(elem).attr("href")).get();
        return {
            type: "full",
            title: title,
            chapter: chapter.map(link => () => this.getChapter(link)).reverse()
        }
    }
    getInfo(link: string): Promise<Info>
    {
        if (link.includes("comic-chapter"))
            return this.getChapter(link);
        else
            return this.getManga(link);
    }
}