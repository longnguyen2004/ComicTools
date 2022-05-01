import { Transform, TransformCallback } from "stream"

export class BufferedPassThrough extends Transform
{
    private _minChunkSize: number;
    private _buffer: Buffer;
    constructor(minChunkSize: number)
    {
        super();
        this._minChunkSize = minChunkSize;
        this._buffer = Buffer.alloc(0);
    }
    override _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void
    {
        this._buffer = Buffer.concat([this._buffer, chunk]);
        if (this._buffer.length >= this._minChunkSize)
        {
            this.push(this._buffer);        
            this._buffer = Buffer.alloc(0);
        }
        callback();
    }
    override _final(callback: TransformCallback): void {
        if (this._buffer.length > 0)
        {
            this.push(this._buffer);
        }
        callback();
    }
    override _destroy(error: Error | null, callback: (error: Error | null) => void): void
    {
        if (this._buffer.length > 0)
        {
            this.push(this._buffer);
        }
        callback(error);
    }
}