function range(end: number): Iterable<number>
function range(start: number, end: number): Iterable<number>
function *range(startOrEnd: number, end?: number, step?: number)
{
    let _start: number, _end: number, _step: number
    if (end !== undefined)
    {
        _start = startOrEnd;
        _end = end;
        if (step !== undefined)
            _step = step;
        else
            _step = Math.sign(end - startOrEnd);
    }
    else
    {
        _start = 0;
        _end = startOrEnd;
        _step = 1;
    }
    for (let i = _start; (_end - i) * Math.sign(_step) > 0; i += _step)
        yield i;
}

export { range }