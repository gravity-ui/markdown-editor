import type {transform} from '@diplodoc/latex-extension';
import type {useLatex} from '@diplodoc/latex-extension/react';

export type TransformMeta = {script?: string[]; style?: string[]} | undefined;

export type DiplodocLatexRuntime = NonNullable<
    NonNullable<Parameters<typeof transform>[0]>['runtime']
>;

export type DiplodocLatexOptions = Omit<
    NonNullable<Parameters<ReturnType<typeof useLatex>>[0]>,
    'nodes' | 'querySelector'
>;
