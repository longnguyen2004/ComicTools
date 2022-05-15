import { got } from "./GotInstance.js";
import { OptionsInit, Progress, Request, RequestError } from "got-scraping";
import { settings } from "./Settings.js";
import { MultiBar } from "./MultiProgressBar.js";
import { getInfo } from "./Extractor.js";
import { MangaInfo, ChapterInfo } from "./Info.js";
import { Logger } from "./Logger.js";

import pMap from "p-map";
import * as fs from "fs/promises";
import { existsSync, createWriteStream } from "fs";
import { fileTypeFromFile } from "file-type";
import { pipeline } from "stream/promises";

type RetryHandler = (
    retryCount: number,
    error: RequestError,
    createRetryStream: (updatedOptions?: OptionsInit) => Request
) => void;

export class Downloader {
    static logger = new Logger("Downloader");
    private static multibar: MultiBar;
    private static removeUnsafeCharacters(s: string)
    {
        return s.replace(/[<>:"/\\|?*]/g, "_");
    }
    private static stringCleanup(s: string)
    {
        return s
            .replace(/ +([.,?!:;]) */g, "$1 ")      // proper spaces for punctuations
            .replace(/ *" *(.+?) *" */g, ' "$1" ')  // quotation marks
            .replace(/^\s+|\s+$/g, "")              // remove left & right padding
            .replace(/\s/g, " ")                    // replace all whitespaces with " "
            .replace(/ {2,}/g, " ")                 // remove repeated spaces
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
        folder = await this.createFolderStructure(
            `${folder}/${(prefix ?? "") + this.removeUnsafeCharacters(title)}`
        );
        if (existsSync(`${folder}/.complete`))
        {
            bar.stop();
            return;
        }
        try
        {
            bar.update(0, { info: title, status: "Downloading..." });
            let total = 0;
            await pMap(info.img, async (img, idx) => {
                idx += 1;
                const typedInfo = info as ChapterInfo;
                const padLength = Math.floor(Math.log10(typedInfo.img.length)) + 1;
                const fileName = `${folder}/${idx.toString().padStart(padLength, "0")}.tmp`;
                const startDownload = async (
                    resolve: (value: void) => void, 
                    reject: (error: any) => void,
                    retryStream?: Request
                ) => {
                    let lastReceived = 0;
                    const retryHandler: RetryHandler = (retryCount, error, createRetryStream) => {
                        bar.increment(-(error.request?.downloadProgress.transferred ?? 0));
                        startDownload(resolve, reject, createRetryStream());
                    }
                    const downloadStream = retryStream ?? got(this.stringCleanup(img), {
                        ...typedInfo.downloadOptions,
                        isStream: true,
                    });
                    if (!retryStream)
                    {
                        downloadStream.once("downloadProgress", (progress: Progress) => {
                            total += progress.total ?? 0;
                            bar.setTotal(total);
                        });
                    }
                    downloadStream.on("downloadProgress", (progress: Progress) => {
                        bar.increment(progress.transferred - lastReceived);
                        lastReceived = progress.transferred;
                    });
                    downloadStream.once("retry", retryHandler);
                    downloadStream.once("error", reject);
                    downloadStream.once("response", async () => {
                        downloadStream.off("error", reject);
                        const writePipeline = pipeline(downloadStream, createWriteStream(fileName));
                        try
                        {
                            await writePipeline;
                            const { ext } = (await fileTypeFromFile(fileName))!;
                            await fs.rename(fileName, fileName.replace("tmp", ext));
                            resolve();
                        }
                        catch (e)
                        {
                            if ((e as any).code !== "ERR_STREAM_PREMATURE_CLOSE")
                                reject(e);
                        }
                    });
                }
                return new Promise(startDownload);
            },
            {
                concurrency: info.throttle ?? settings.imgThrottle ?? Number.POSITIVE_INFINITY,
                stopOnError: false
            });
            await fs.writeFile(`${folder}/.complete`, "");
        }
        finally
        {
            bar.stop();
        }
    }
    private static async downloadFull(info: MangaInfo, folder: string)
    {
        const title = this.stringCleanup(info.title);
        folder = await this.createFolderStructure(
            `${folder}/${this.removeUnsafeCharacters(title)}`
        );
        this.logger.log("Title:", title);
        this.logger.log("Chapter count:", info.chapter.length);
        const bar = this.multibar.create(info.chapter.length, 0, { info: title, valueType: "count" });
        let failed = 0;
        await pMap(info.chapter, async (elem, index) => {
            try
            {
                await this.downloadChapter(elem, folder, `${index + 1}. `);
                bar.increment();
            }
            catch (e)
            {
                failed++;
                bar.update({ failed: failed });
                throw e;
            }
        },
        {
            concurrency: info.throttle ?? settings.chapterThrottle ?? Number.POSITIVE_INFINITY,
            stopOnError: false
        });
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