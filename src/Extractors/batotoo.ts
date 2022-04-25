import { Info, MangaInfo, ChapterInfo } from "../Info.js";
import { Extractor } from "../Extractor.js";

import CryptoJS from "crypto-js";
const { AES, enc } = CryptoJS;

export default class batotoo extends Extractor
{
    static siteName = "batotoo";
    static pattern = /(((batotoo|battwo)\.com)|(bato\.to))\/(series|chapter)\/\d+/
    async getChapter(link: string): Promise<ChapterInfo>
    {
        const [_, $] = await this.loadSite(link);
        const script = $("body > script:nth-child(14)").html()!.split("\n");
        const episodeID = Function(script[4] + "return episodeIid;")();
        const title = ($(`option[value=${episodeID}]`)[0] as cheerio.TagElement).children[0].data!;
        const img = Function("AES", "enc", script[2] + script[5] + script[6] + `
            const host = JSON.parse(AES.decrypt(server, batojs).toString(enc.Utf8));
            return images.map(elem => host + elem);
        `)(AES, enc);
        return {
            type: "chapter",
            title: title.trim().replace("\n           ",""),
            img: img
        }
    }
    async getManga(link: string): Promise<MangaInfo>
    {
        const [_, $] = await this.loadSite(link)
        const chapterLinks = $(".chapt").map((_, elem) => $(elem).attr("href")).get();
        const title = $(".item-title > a").text();
        return {
            type: "full",
            title: title,
            chapter: chapterLinks.map(link =>
                () => this.getChapter(new URL(link, "https://batotoo.com").toString())
            ).reverse()
        }
    }
    getInfo(link: string): Promise<Info>
    {
        if (link.includes("series"))
            return this.getManga(link);
        else
            return this.getChapter(link);
    }
}