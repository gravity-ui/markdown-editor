import type {transform} from '@diplodoc/latex-extension';
import type {useLatex} from '@diplodoc/latex-extension/react';
import type {transform as pageConstructor} from '@diplodoc/page-constructor-extension/plugin/csr';

export type TransformMeta = {script?: string[]; style?: string[]} | undefined;

export type DiplodocLatexRuntime = NonNullable<
    NonNullable<Parameters<typeof transform>[0]>['runtime']
>;

export type DiplodocLatexOptions = Omit<
    NonNullable<Parameters<ReturnType<typeof useLatex>>[0]>,
    'nodes' | 'querySelector'
>;

export type DiplodocPageConstructorRuntime = NonNullable<
    NonNullable<Parameters<typeof pageConstructor>[0]>['runtime']
>;
