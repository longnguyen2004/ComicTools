import { Info, MangaInfo, ChapterInfo } from "../Info.js";
import { Extractor } from "../Extractor.js";

export default class toonily extends Extractor
{
    static siteName = "toonily";
    static pattern = /toonily\.me\/.+(\/.+)?/;
    static _prefixUrl = "https://toonily.me";
    async getChapter(link: string): Promise<ChapterInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = $(".breadcrumbs-item").last().text();
        const img = $(".chapter-image > img").map((_, elem) => "https:" + $(elem).attr("data-src")).get();
        return {
            type: "chapter",
            title: title,
            img: img,
            downloadOptions: {
                headers: {
                    referer: toonily._prefixUrl
                }
            }
        }
    }
    async getManga(link: string): Promise<MangaInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = $(".name > h1").text();
        const { pathname } = new URL(link);
        const [_chapter, $chapter] = await this.loadSite(
            "https://toonily.me/api/manga" + pathname + "/chapters"
        );
        const chapterLinks = $chapter("option").map((_, elem) => $chapter(elem).val()).get();
        return {
            type: "full",
            title: title,
            chapter: chapterLinks.map(link =>
                () => this.getChapter(new URL(link, toonily._prefixUrl).toString())
            ).reverse()
        }
    }
    getInfo(link: string): Promise<Info>
    {
        return Extractor.countSubdirectories(link) === 1 ?
            this.getManga(link) : this.getChapter(link)
    }
}