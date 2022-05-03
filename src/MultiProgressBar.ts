import cliProgress, { Options, Params } from "cli-progress"
const { Format } = cliProgress;

type Payload = {
    info?: string,
    status?: string,
    valueType: "count" | "size",
    failed?: number,
}
class CustomMultiBar extends cliProgress.MultiBar
{
    static barFormatter(progress: number, options: Options)
    {
        const blockChars = [" ", "\u258F", "\u258E", "\u258D", "\u258C", "\u258B", "\u258A", "\u2589", "\u2588"];
        const barsize = options.barsize!;
        const progressScaled = progress * barsize;
        const complete = Math.floor(progressScaled);
        const incomplete = Math.floor(barsize - progressScaled);
        const partial = Math.floor((progressScaled - complete) * 8);
        return blockChars[8].repeat(complete) +
               (complete + incomplete === barsize ? "" : blockChars[partial]) +
               blockChars[0].repeat(incomplete);
    }
    static sizeFormatter(value: number)
    {
        const exponent = Math.floor(Math.log2(value) / 10);
        value = value / Math.pow(1024, exponent);
        const suffix = ["", "Ki", "Mi", "Gi", "Ti"];
        return `${value.toFixed(2)}${suffix[exponent]}B`;
    }
    static formatter(options: Options, params: Params, payload: Payload): string
    {
        const { value, total, progress, eta } = params;
        const bar = CustomMultiBar.barFormatter(params.progress, options);
        const percentage = (progress * 100).toFixed(2).padStart(6) + "%";
        const progressString = [value, total].map(
            (val) => {
                if (val === 0) return "--";
                return payload.valueType === "count" ? val : CustomMultiBar.sizeFormatter(val);
            }
        ).join("/");
        let output = "";
        output += `|${bar}| ${percentage} (${progressString})`;
        output += ` | ETA: ${params.total !== 0 ? Format.TimeFormat(eta, options, 5) : "--"}`;
        output += payload.info ? ` | ${payload.info}` : "";
        output += payload.status ? ` | ${payload.status}` : "";
        output += payload.failed ? ` (Failed: ${payload.failed})` : "";
        return output;
    }
    constructor()
    {
        super({
            format: CustomMultiBar.formatter,
            barsize: 25,
            emptyOnZero: true,
            clearOnComplete: true,
		    forceRedraw: true
        }, cliProgress.Presets.legacy);
    }
    create(total: number, startValue: number, payload?: any): cliProgress.SingleBar {
        const bar = super.create(total, startValue, payload);
        bar.on("stop", () => { this.remove(bar) });
        return bar;
    }
}

export { CustomMultiBar as MultiBar }