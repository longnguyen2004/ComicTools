import cliProgress, { Options, Params, ValueType } from "cli-progress"
const { Format } = cliProgress;

type Payload = {
    info?: string,
    status?: string,
    valueType: "count" | "size",
    failed?: number,
}
class CustomMultiBar extends cliProgress.MultiBar
{
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
        const bar = Format.BarFormat(params.progress, options);
        const percentage = (progress * 100).toFixed(2).padStart(6) + "%";
        const progressString = [value, total].map(
            (val) => {
                if (val === 0) return "--";
                return payload.valueType === "count" ? val : CustomMultiBar.sizeFormatter(val);
            }
        ).join("/");
        let output = "";
        output += `[${bar}] ${percentage} (${progressString})`;
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