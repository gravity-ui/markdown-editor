declare module 'markdown-it-attrs' {
    import type {PluginWithOptions} from 'markdown-it';
    export type AttrsOptions = {
        /** @default '{' */
        leftDelimiter?: string;
        /** @default '}' */
        rightDelimiter?: string;
        /**
         * empty array = all attributes are allowed
         * @default []
         */
        allowedAttributes?: (string | RegExp)[];
    };
    declare const plugin: PluginWithOptions<AttrsOptions>;
    export = plugin;
}

declare module 'markdown-it-deflist' {
    import type {PluginSimple} from 'markdown-it';
    declare const plugin: PluginSimple;
    export = plugin;
}

declare module 'markdown-it-mark' {
    import type {PluginSimple} from 'markdown-it';
    declare const plugin: PluginSimple;
    export = plugin;
}

declare module 'markdown-it-sub' {
    import type {PluginSimple} from 'markdown-it';
    declare const plugin: PluginSimple;
    export = plugin;
}

declare module 'markdown-it-ins' {
    import type {PluginSimple} from 'markdown-it';
    declare const plugin: PluginSimple;
    export = plugin;
}
