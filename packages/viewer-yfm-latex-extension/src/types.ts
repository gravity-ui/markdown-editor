import type {useLatex} from '@diplodoc/latex-extension/react';

export type YfmLatexRuntime = string | {script: string; style: string};

export type YfmLatexOptions = Omit<
    NonNullable<Parameters<ReturnType<typeof useLatex>>[0]>,
    'nodes' | 'querySelector'
>;
