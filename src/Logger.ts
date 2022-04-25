const writer = [console.log, console.warn, console.error];

class Logger {
    private readonly source: string;
    constructor(source: string)
    {
        this.source = source;
    }
    log(message: string, severity: Logger.Severity = Logger.Severity.INFO): void
    {
        const output = `[${this.source}] ${message}`;
        writer[severity].call(console, output);
    }
}

namespace Logger
{
    export enum Severity
    {
        INFO,
        WARNING,
        ERROR
    }
}

export { Logger }
