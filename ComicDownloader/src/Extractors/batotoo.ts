import { Info, MangaInfo, ChapterInfo } from "../Info.js";
import { Extractor } from "../Extractor.js";

import { zipWith } from "lodash-es"
import CryptoJS from "crypto-js";
const { AES, enc } = CryptoJS;

export default class batotoo extends Extractor
{
    static siteName = "batotoo";
    static pattern = /((batotoo|battwo)\.com|bato\.to|comiko\.net)\/(series|chapter)\/\d+/
    async getChapter(link: string): Promise<ChapterInfo>
    {
        const [html, $] = await this.loadSite(link);
        const episodeID = html.match(/const episodeIid = (\d+);/)![1];
        const title = $(`option[value=${episodeID}]`).first().text();
        const img: string[] = JSON.parse(html.match(/const imgHttpLis = (\[.+\]);/)![1]);
        const batoWord = html.match(/const batoWord = "(.+)";/)![1];
        const batoPass = eval(html.match(/const batoPass = (.+);/)![1]);
        const token: string[] = JSON.parse(AES.decrypt(batoWord, batoPass).toString(enc.Utf8));
        return {
            type: "chapter",
            title: title,
            img: zipWith(img, token, (_1, _2) => _1 + "?" + _2)
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