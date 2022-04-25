import { MangaInfo, ChapterInfo } from "../Info.js";
import { WordpressTemplate } from "./Helpers/Wordpress.js";

export default class mangaforfree extends WordpressTemplate
{
    static siteName = "mangaforfree";
    static pattern = /mangaforfree\.net\/manga\/.+(\/.+)?/;
    static _prefixUrl = "https://mangaforfree.net";

    async getChapter(link: string): Promise<ChapterInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = $(`.active`).text();
        const img = $(".page-break > img").map((_, elem) => $(elem).attr("src")).get();
        return {
            type: "chapter",
            title: title,
            img: img,
            downloadOptions: {
                headers: {
                    referer: mangaforfree._prefixUrl
                },
                timeout: {
                    request: 60000 // server is slow, allow for 1min
                }
            },
            throttle: 10
        }
    }
    async getManga(link: string): Promise<MangaInfo>
    {
        const [html, $] = await this.loadSite(link);
        const title = $(".post-title > h1").children().remove().end().text();
        const $chapter = await this._getChapter_AdminAjax(html, mangaforfree._prefixUrl);
        const chapterLinks: string[] = $chapter(".wp-manga-chapter > a")
            .map((_, elem) => $chapter(elem).attr("href")).get();
        return {
            type: "full",
            title: title,
            chapter: chapterLinks.map(link => () => this.getChapter(link)).reverse()
        }
    }
    
}