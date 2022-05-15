import { ChapterInfo, MangaInfo } from "../Info.js";
import { WordpressTemplate } from "./Helpers/Wordpress.js";

export default class _1stkissmanga extends WordpressTemplate
{
    static siteName = "1stkissmanga";
    static pattern = /1stkissmanga\.(io|com)\/manga\/[a-z0-9-]+(\/[a-z0-9-]+)?/;
    static _prefixUrl = "https://1stkissmanga.io";

    async getChapter(link: string): Promise<ChapterInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = $(".active").text();
        const img = $(".page-break > img").map((_, elem) => $(elem).attr("data-lazy-src")).get();
        return {
            type: "chapter",
            title: title,
            img: img,
            downloadOptions: {
                headers: {
                    referer: _1stkissmanga._prefixUrl
                }
            },
            throttle: 1 // no point downloading in parallel, server only allows 1 at a time
        }
    }

    async getManga(link: string): Promise<MangaInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = $(".post-title > h1").children().remove().end().text();
        const chapterLinks: string[] = $(".wp-manga-chapter > a")
            .map((_, elem) => $(elem).attr("href")).get();
        return {
            type: "full",
            title: title,
            chapter: chapterLinks.map(link => () => this.getChapter(link)).reverse(),
            throttle: 1 // no point downloading in parallel, server only allows 1 at a time
        }
    }
}