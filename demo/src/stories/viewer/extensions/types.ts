import type {transform} from '@diplodoc/latex-extension';
import type {useLatex} from '@diplodoc/latex-extension/react';
import type {transform as mermaid} from '@diplodoc/mermaid-extension';
import type {useMermaid} from '@diplodoc/mermaid-extension/react';
import type {transform as pageConstructor} from '@diplodoc/page-constructor-extension/plugin/csr';
import type {ThemeType} from '@gravity-ui/uikit';

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

export type DiplodocMermaidRuntime = NonNullable<
    NonNullable<Parameters<typeof mermaid>[0]>['runtime']
>;

type MermaidTheme = NonNullable<Parameters<ReturnType<typeof useMermaid>>[0]['theme']>;

export type DiplodocMermaidTheme = MermaidTheme | Record<ThemeType, MermaidTheme>;

export type DiplodocMermaidOptions = Omit<
    Parameters<ReturnType<typeof useMermaid>>[0],
    'theme' | 'startOnLoad'
>;
