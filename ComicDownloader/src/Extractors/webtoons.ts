import { Info, MangaInfo, ChapterInfo } from "../Info.js";
import { Extractor } from "../Extractor.js";

export default class webtoons extends Extractor
{
    static siteName = "webtoons";
    static pattern = /webtoons\.com\/\w{2}\/[a-z-]+\/[a-z-]+\/(list|[a-z0-9-]+\/viewer)\?title_no=\d+(&episode_no=\d+)?/;
    async _getChapterLinks(link: string)
    {
        let chapterLinks: string[] = [];
        this.logger.log("Paginating...");
        // Starts at page 1
        const url = new URL(link);
        url.searchParams.set("page", "1");
        link = url.toString();
        do
        {
            this.logger.log("Current page:", link.match(/&page=(\d+)/)![1])
            const [_, $] = await this.loadSite(link);
            chapterLinks = [...chapterLinks, ...$("#_listUl > li > a").map((_, elem) => $(elem).attr("href")!).get()];
            const dir = $(".paginate > a[href='#']").next().attr("href");
            link = dir ? "https://webtoons.com" + dir : "";
        }
        while (link);
        return chapterLinks.reverse();
    }
    async getChapter(link: string): Promise<ChapterInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = $(".subj_episode").text();
        const img: string[] = $("._images").map((_, elem) => $(elem).attr("data-url")).get();
        return {
            type: "chapter",
            title: title,
            img: img,
            downloadOptions: {
                headers: {
                    referer: "https://webtoons.com"
                },
                timeout: {
                    // Server can be very slow
                    request: 60000,
                    read: 60000
                }
            }
        }

    }
    async getManga(link: string): Promise<MangaInfo>
    {
        const [_, $] = await this.loadSite(link);
        const title = $("div.info > .subj").text();
        return {
            type: "full",
            title: title,
            chapter: (await this._getChapterLinks(link))
                .map(elem => () => this.getChapter(elem))
        }
    }
    getInfo(link: string): Info | Promise<Info>
    {
        if (link.includes("episode_no"))
            return this.getChapter(link);
        else
            return this.getManga(link);
    }
}