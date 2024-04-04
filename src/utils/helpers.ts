import type Token from 'markdown-it/lib/token';

export const attrsFromEntries = (tok: Token) => {
    if (tok.attrs) return Object.fromEntries(tok.attrs);
    return {};
};

export type TryCatchReturnType<R> = {success: true; result: R} | {success: false; error: any};
export function tryCatch<R>(fn: () => R): TryCatchReturnType<R> {
    try {
        const result = fn();
        return {success: true, result};
    } catch (error) {
        console.error(error);
        return {success: false, error};
    }
}
