import { ChapterInfo, MangaInfo } from "../Info.js";
import { WordpressTemplate } from "./Helpers/Wordpress.js";

export default class zinmanga extends WordpressTemplate
{
    static siteName = ["topmanhua", "zinmanga"];
    static pattern = /(topmanhua|zinmanga)\.com\/(manga|manhua)\/.+(\/.+)?/;
    static _prefixUrl = "https://zinmanga.com";

    async getChapter(link: string): Promise<ChapterInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = $(".active").text();
        const img = $(".page-break > img").map((_, elem) => $(elem).attr("data-src")).get();
        return {
            type: "chapter",
            title: title,
            img: img,
            downloadOptions: {
                headers: {
                    referer: zinmanga._prefixUrl
                }
            },
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
        }
    }
}