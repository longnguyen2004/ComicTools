import chalk from "chalk";
import util from "util"

class Logger {
    private readonly source: string;
    constructor(source: string)
    {
        this.source = source;
    }
    log(...object: any[]): void
    {
        const output = util.format(`[${this.source}]`, ...object);
        console.log(output);
    }
    warn(...object: any[]): void
    {
        const output = util.format(`[${this.source}]`, ...object);
        console.warn(chalk.yellowBright(output));
    }
    error(...object: any[]): void
    {
        const output = util.format(`[${this.source}]`, ...object);
        console.error(chalk.redBright(output));
    }
}

export { Logger }
