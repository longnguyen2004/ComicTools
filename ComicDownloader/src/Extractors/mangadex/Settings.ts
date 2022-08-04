import { settings } from "../../Settings.js";

if (!settings.mangadex)
{
    settings.mangadex = {
        auth: {}
    }
}

export const mdSettings = settings.mangadex as MangaDexSettings;

export type MangaDexSettings = {
    languages: string[];
    auth: MangaDexAuthSettings;
}

export type MangaDexAuthSettings = {
    token: {
        lastAuthTime: number;
        lastRefreshTime: number;
        session: string;
        refresh: string;
    }
    username: string;
    password: string;
}

