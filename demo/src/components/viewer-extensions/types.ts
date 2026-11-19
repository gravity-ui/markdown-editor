import type {PluginOptions as HtmlPluginOptions} from '@diplodoc/html-extension';
import type {transform as pageConstructor} from '@diplodoc/page-constructor-extension/plugin/csr';

export type TransformMeta = {script?: string[]; style?: string[]} | undefined;

export type DiplodocHtmlRuntime = HtmlPluginOptions['runtimeJsPath'];

export type DiplodocPageConstructorRuntime = NonNullable<
    NonNullable<Parameters<typeof pageConstructor>[0]>['runtime']
>;
