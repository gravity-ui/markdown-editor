// copied from https://github.com/diplodoc-platform/latex-extension/blob/7958a99a7d77f31fb5c4cf485990cbbd82ebe3f0/src/types.ts
// and https://github.com/diplodoc-platform/latex-extension/blob/7958a99a7d77f31fb5c4cf485990cbbd82ebe3f0/src/%40types/globals.d.ts

import type {KatexOptions} from 'katex';

export type {KatexOptions};

export type RunOptions = KatexOptions & {
    querySelector?: string;
    nodes?: HTMLElement[];
    sanitize?: (content: string) => string;
};

export type ExposedAPI = {
    run: (options?: RunOptions) => Promise<void>;
};

declare global {
    interface Window {
        latexJsonp: Callback[];
    }

    type Callback = (exposed: ExposedAPI) => void | Promise<void>;
}
