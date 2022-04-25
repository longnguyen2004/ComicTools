import { Extractor } from "../Extractor.js";
import { Info } from "../Info.js";

export default class extends Extractor
{
    static siteName: string = "test";
    getInfo(link: string): Info {
        return {
            type: "full",
            title: "",
            chapter: []
        }
    }
}
