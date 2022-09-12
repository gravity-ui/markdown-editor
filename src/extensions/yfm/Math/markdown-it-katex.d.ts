declare module 'markdown-it-katex' {
    import {KatexOptions} from 'katex';
    import {PluginWithOptions} from 'markdown-it';
    type Options = Pick<KatexOptions, 'errorColor' | 'throwOnError'>;
    declare const mathPlugin: PluginWithOptions<Options>;
    export = mathPlugin;
}
