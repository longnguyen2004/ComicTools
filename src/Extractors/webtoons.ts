import { Info, MangaInfo, ChapterInfo } from "../Info.js";
import { Extractor } from "../Extractor.js";

export default class webtoons extends Extractor
{
    static siteName = "webtoons";
    static pattern = /webtoons\.com\/\w{2}\/[a-z-]+\/[a-z-]+\/(list|[a-z0-9-]+\/viewer)\?title_no=\d+(&episode_no=\d+)?/;
    async _getChapterLinks(link: string)
    {
        const _paginate = async(link: string) =>
        {
            this.logger.log("Paginating...");
            // Starts at page 1
            const url = new URL(link);
            url.searchParams.set("page", "1");
            link = url.toString();
            let pages: string[] = [link];
            let $: cheerio.Root;
            do
            {
                this.logger.log("Current page:", link.match(/&page=(\d+)/)![1])
                $ = (await this.loadSite(link))[1];
                $(".pg_prev").remove();
                const morePages: string[] = $(".paginate > a").slice(1)
                    .map((_, elem) => "https://webtoons.com" + $(elem).attr("href")).get();
                pages = [...pages, ...morePages];
                link = morePages.pop()!;
            }
            while ($(".pg_next").length)
            this.logger.log("Page count:", pages.length);
            return pages;
        }
        const pages = await _paginate(link);
        let chapterLinks: string[] = [];
        for (const [idx, page] of pages.entries())
        {
            const [_, $] = await this.loadSite(page);
            const moreLinks: string[] = $("#_listUl > li > a")
                .map((_, elem) => $(elem).attr("href")).get();
            chapterLinks = [...chapterLinks, ...moreLinks];
        }
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