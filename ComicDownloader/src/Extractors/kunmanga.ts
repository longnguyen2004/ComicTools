import { MangaInfo, ChapterInfo } from "../Info.js";
import { WordpressTemplate } from "./Helpers/Wordpress.js";

export default class kunmanga extends WordpressTemplate
{
    static siteName = "kunmanga";
    static pattern = /kunmanga\.com\/manga\/[a-z0-9-]+(\/[a-z0-9-]+)?/;
    async getChapter(link: string): Promise<ChapterInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = $(".active").text();
        const img = $(".wp-manga-chapter-img").map((_, elem) => $(elem).attr("src")).get() as string[];
        return {
            type: "chapter",
            title: title,
            img: img,
            downloadOptions: {
                headers: {
                    referer: "https://kunmanga.com"
                }
            }
        }
    }
    async getManga(link: string): Promise<MangaInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = $(".post-title h1").text();
        const chapter = $(".wp-manga-chapter a").map((_, elem) => $(elem).attr("href")).get() as string[];
        return {
            type: "full",
            title: title,
            chapter: chapter.map(link => () => this.getChapter(link)).reverse(),
        }
    }
}