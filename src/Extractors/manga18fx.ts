import { MangaInfo, ChapterInfo } from "../Info.js";
import { WordpressTemplate } from "./Helpers/Wordpress.js";

export default class manga18fx extends WordpressTemplate
{
    static siteName = "manga18fx";
    static pattern = /manga18fx\.com\/manga\/.+(\/.+)?/;
    static _prefixUrl = "https://manga18fx.com";
    async getChapter(link: string): Promise<ChapterInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = $(`.active`).text();
        const img = $(".page-break > img").map((_, elem) => $(elem).attr("data-src")).get();
        return {
            type: "chapter",
            title: title,
            img: img,
            downloadOptions: {
                headers: {
                    referer: manga18fx._prefixUrl
                }
            }
        }
    }
    async getManga(link: string): Promise<MangaInfo>
    {
        const [_, $] = await this.loadSite(link)
        const chapterLinks: string[] = $(".chapter-name").map((_, elem) => $(elem).attr("href")).get();
        const title = $(".post-title > h1").text();
        return {
            type: "full",
            title: title,
            chapter: chapterLinks.map(link =>
                () => this.getChapter(new URL(link, manga18fx._prefixUrl).toString())
            ).reverse()
        }
    }
}