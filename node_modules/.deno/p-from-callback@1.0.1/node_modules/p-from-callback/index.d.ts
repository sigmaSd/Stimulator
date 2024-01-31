type Result<R, M extends boolean> =
    R extends undefined
        ? M extends true
            ? [never, ...never[]] // Should be CompilerError<>
            : [] | [undefined]
        : M extends false
            ? [R, ...any[]]
            : R extends any[]
                ? R
                : [never, ...never[]]; // Should be CompilerError<>

declare function fromCallback<R, M extends boolean = false>(
    fn: (callback: (error?: any, ...result: Result<R, M>) => unknown) => unknown,
    multi?: M,
): Promise<R>;

export default fromCallback;
