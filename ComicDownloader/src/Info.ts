import type { OptionsInit } from "got-scraping";

interface ChapterInfo
{
    type: "chapter";
    title: string;
    img: string[]
    downloadOptions?: OptionsInit;
    throttle?: number;
}

interface MangaInfo
{
    type: "full";
    title: string;
    chapter: (() => Promise<ChapterInfo>)[];
    throttle?: number;
}

type Info = MangaInfo | ChapterInfo;
export { Info, MangaInfo, ChapterInfo };