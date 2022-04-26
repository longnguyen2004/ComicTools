import cheerio from "cheerio";
import { Extractor } from "../../Extractor.js";
import { ChapterInfo, Info, MangaInfo } from "../../Info.js";

export abstract class WordpressTemplate extends Extractor
{
    static _getMangaIDFromHTML(html: string)
    {
        let id: number | undefined;

        const shortlinkRegex = /\/\?p=(\d+)/;
        const shortlinkMatch = html.match(shortlinkRegex)?.at(1);
        id = shortlinkMatch ? Number.parseInt(shortlinkMatch) : undefined;
        return id;
    }

    async _getChapter_AdminAjax(html: string, prefix: string)
    {
        const id = WordpressTemplate._getMangaIDFromHTML(html);
        if (!id) throw new Error("[Wordpress] Cannot get manga ID");
        const chapterHtml = await this.got.post("wp-admin/admin-ajax.php", {
            form: {
                action: "manga_get_chapters",
                manga: id
            },
            prefixUrl: prefix
        }).text();
        return cheerio.load(chapterHtml);
    }

    abstract getManga(link: string): Promise<MangaInfo>;
    abstract getChapter(link: string): Promise<ChapterInfo>;

    getInfo(link: string): Promise<Info> {
        const isMangaLink = Extractor.countSubdirectories(link) === 2;
        return isMangaLink ? this.getManga(link) : this.getChapter(link);
    }
}



