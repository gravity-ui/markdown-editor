export {};

declare module 'katex' {
    export interface KatexOptions {
        /**
         * If `true`, KaTeX will throw a `ParseError` when
         * it encounters an unsupported command or invalid LaTex
         *
         * If `false`, KaTeX will render unsupported commands as
         * text, and render invalid LaTeX as its source code with
         * hover text giving the error, in color given by errorColor
         * @default true
         */
        throwOnError?: boolean | undefined;
    }
}
