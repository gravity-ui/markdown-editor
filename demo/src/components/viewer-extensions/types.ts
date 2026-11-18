import type {PluginOptions as HtmlPluginOptions} from '@diplodoc/html-extension';
import type {transform as mermaid} from '@diplodoc/mermaid-extension';
import type {useMermaid} from '@diplodoc/mermaid-extension/react';
import type {transform as pageConstructor} from '@diplodoc/page-constructor-extension/plugin/csr';
import type {ThemeType} from '@gravity-ui/uikit';

export type TransformMeta = {script?: string[]; style?: string[]} | undefined;

export type DiplodocHtmlRuntime = HtmlPluginOptions['runtimeJsPath'];

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
