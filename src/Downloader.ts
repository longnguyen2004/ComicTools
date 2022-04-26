import { got } from "./GotInstance.js";
import type { OptionsInit, Progress, Request, RequestError } from "got-scraping";
import { settings } from "./Settings.js";
import { MultiBar } from "./MultiProgressBar.js";
import { getInfo } from "./Extractor.js";
import { MangaInfo, ChapterInfo } from "./Info.js";

import pMap from "p-map";
import * as fs from "fs/promises";
import { createWriteStream, WriteStream } from "fs";
import { fileTypeStream } from "file-type";
import { pipeline } from "stream/promises";

type RetryHandler = (
    retryCount: number,
    error: RequestError,
    createRetryStream: (updatedOptions?: OptionsInit) => Request
) => void;

export class Downloader {
    private static multibar: MultiBar;
    private static removeUnsafeCharacters(s: string)
    {
        return s.replace(/[<>:"/\\\|\?\*]/g, "_");
    }
    private static stringCleanup(s: string)
    {
        return s
            .replace(/(^\s+)|(\s+$)/g, "")    // remove left & right padding
            .replace(/\s/g, " ")        // replace all whitespaces with " "
            .replace(/ {2, }/g, " ")         // remove repeated spaces
    }
    private static async createFolderStructure(folder: string)
    {
        try
        {
            await fs.mkdir(folder, { recursive: true });
        }
        catch (e: any)
        {
            if (e.code !== "EEXIST") throw e;
        }
        return folder;
    }
    private static async downloadChapter(
        info: ChapterInfo | (() => Promise<ChapterInfo>),
        folder: string, prefix?: string
    )
    {
        const bar = this.multibar.create(0, 0, { valueType: "size" });
        if (info instanceof Function)
        {
            bar.update(0, { status: "Getting chapter info..." });
            info = await info();
        }
        const title = this.stringCleanup(info.title);
        bar.update(0, { info: title, status: "Downloading..." });
        folder = await this.createFolderStructure(
            `${folder}/${(prefix ?? "") + this.removeUnsafeCharacters(title)}`
        );
        let total = 0;
        await pMap(info.img, async (img, idx) => {
            idx += 1;
            let lastReceived = 0, thisTotal = 0;
            let fileStream: WriteStream;
            const padLength = Math.floor(Math.log10((info as ChapterInfo).img.length)) + 1;
            const fileName = `${folder}/${idx.toString().padStart(padLength, "0")}.tmp`;
            const startDownload = async (
                resolve: (value: void) => void, 
                reject: (error: any) => void,
                retryStream?: Request) =>
            {
                const retryHandler: RetryHandler = (retryCount, error, createRetryStream) => {
                    if (retryCount > 3) reject(error);
                    total -= thisTotal;
                    bar.increment(-lastReceived);
                    startDownload(resolve, reject, createRetryStream());
                }
                const downloadStream = retryStream ?? got(this.stringCleanup(img), {
                    ...(info as ChapterInfo).downloadOptions,
                    isStream: true,
                });
                const newStream = await fileTypeStream(downloadStream);
                if (fileStream) fileStream.destroy();
                fileStream = createWriteStream(fileName);
                pipeline(newStream, fileStream).catch(() => {});

                downloadStream.once("downloadProgress", (progress: Progress) => {
                    thisTotal = progress.total ?? 0;
                    total += thisTotal;
                    bar.setTotal(total);
                });
                downloadStream.on("downloadProgress", (progress: Progress) => {
                    bar.increment(progress.transferred - lastReceived);
                    lastReceived = progress.transferred;
                });
                downloadStream.once("retry", retryHandler);
                downloadStream.on("end", async () => {
                    await fs.rename(fileName, fileName.replace("tmp", newStream.fileType!.ext));
                    resolve();
                });
            }
            return new Promise(startDownload);
        }, { concurrency: info.throttle ?? settings.imgThrottle ?? Number.POSITIVE_INFINITY});
        bar.stop();
    }
    private static async downloadFull(info: MangaInfo, folder: string)
    {
        const title = this.stringCleanup(info.title);
        folder = await this.createFolderStructure(
            `${folder}/${this.removeUnsafeCharacters(title)}`
        );
        const bar = this.multibar.create(info.chapter.length, 0, { info: title, valueType: "count" });
        await pMap(info.chapter, async (elem, index) => {
            await this.downloadChapter(elem, folder, `${index + 1}. `);
            bar.increment();
        }, { concurrency: info.throttle ?? settings.chapterThrottle ?? Number.POSITIVE_INFINITY });
        bar.stop();
    }
    static async download(link: string, folder: string)
    {
        this.multibar = new MultiBar();
        const info = await getInfo(link);
        if (info.type === "full")
            await this.downloadFull(info, folder);
        else
            await this.downloadChapter(info, folder);
        this.multibar.stop();
    }
}