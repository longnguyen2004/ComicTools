import type { LanguageCode } from "iso-639-1";

export type Error = {
    id: string,
    status: number,
    title: string,
    detail: string
}

export type Auth = {
    result: "ok",
    token: {
        session: string,
        refresh: string
    }
} | {
    result: "error",
    errors: Error
}

export type MangaAggregate = {
    result: "ok",
    volumes: Record<string, {
        volume: string,
        count: number,
        chapters: Record<string, {
            chapter: string,
            count: number,
            id: string,
            others: Array<unknown>
        }>
    }>
} | {
    result: "error",
    errors: Error[]
}

export type MangaInfo = {
    result: "ok",
    response: "entity",
    data: {
        type: "manga",
        id: string,
        attributes: {
            title: Record<LanguageCode, string>
        }
    }
} | {
    result: "error",
    errors: Error
}

export type ChapterInfo = {
    result: "ok",
    response: "entity",
    data: {
        type: "chapter",
        id: string,
        attributes: {
            volume: string,
            chapter: string,
            title: string
        }
    }
} | {
    result: "error",
    errors: Error
}

export type AtHomeInfo = {
    result: "ok",
    baseUrl: string,
    chapter: {
        hash: string,
        data: string[],
        dataSaver: string[]
    }
} | {
    result: "error",
    errors: Error
}

export { LanguageCode };