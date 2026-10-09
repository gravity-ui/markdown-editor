import type {Options} from '@diplodoc/transform';
import type {createLowlight} from 'lowlight' with {'resolution-mode': 'import'};

import type {EditorState} from '#pm/state';
import {Plugin, PluginKey} from '#pm/state';
import type {EditorView} from '#pm/view';
import {capitalize} from 'src/lodash';
import {globalLogger} from 'src/logger';

import {PlainTextLang} from '../const';

export type HighlightLangMap = Options['highlightLangs'];

export type Lowlight = ReturnType<typeof createLowlight>;
export type LLRoot = ReturnType<Lowlight['highlight']>;

type LangItem = {
    value: string;
    content: string;
};

type CodeBlockLangsState = {
    langItems: LangItem[];
    aliasMapping: Record<string, string>;
    lowlight: Lowlight | null;
    loaded: boolean;
};

export const codeBlockLangsPluginKey = new PluginKey<CodeBlockLangsState>('code_block_langs');

const defaultState: CodeBlockLangsState = {
    langItems: [],
    aliasMapping: {},
    lowlight: null,
    loaded: false,
};

export function getCodeBlockLangsState(state: EditorState): CodeBlockLangsState {
    return codeBlockLangsPluginKey.getState(state) ?? defaultState;
}

export function codeBlockLangsPlugin(
    langsConfig: HighlightLangMap | undefined,
    logger: {log: (msg: string) => void},
) {
    return new Plugin<CodeBlockLangsState>({
        key: codeBlockLangsPluginKey,
        state: {
            init: (_config, _state) => {
                return defaultState;
            },
            apply: (tr, state) => {
                const meta = tr.getMeta(codeBlockLangsPluginKey);
                if (meta) return meta as CodeBlockLangsState;
                return state;
            },
        },
        view: (view: EditorView) => {
            loadAndInit(view, langsConfig, logger);
            return {};
        },
    });
}

async function loadAndInit(
    view: EditorView,
    langsConfig: HighlightLangMap | undefined,
    logger: {log: (msg: string) => void},
) {
    try {
        const [{default: hljs}, low] = await Promise.all([
            import('highlight.js/lib/core'),
            import('lowlight'),
        ]);

        const all: HighlightLangMap = low.all;
        const create: typeof createLowlight = low.createLowlight;
        const langs: NonNullable<HighlightLangMap> = {...all, ...langsConfig};
        const lowlight = create(langs);

        const langItems: LangItem[] = [];
        const aliasMapping: Record<string, string> = {};

        for (const lang of Object.keys(langs)) {
            const defs = langs[lang](hljs);
            langItems.push({
                value: lang,
                content: defs.name || capitalize(lang),
            });
            if (defs.aliases) {
                for (const alias of defs.aliases) {
                    aliasMapping[alias] = lang;
                }
            }
        }

        langItems.sort(sortLangs);

        if (!view.isDestroyed) {
            const newState: CodeBlockLangsState = {
                langItems,
                aliasMapping,
                lowlight,
                loaded: true,
            };
            view.dispatch(view.state.tr.setMeta(codeBlockLangsPluginKey, newState));
        }
    } catch (e) {
        globalLogger.info('Skip code_block highlighting');
        logger.log('Skip code_block highlighting');
    }
}

function sortLangs(a: LangItem, b: LangItem): number {
    // plaintext always goes first
    if (a.value === PlainTextLang) return -1;
    if (b.value === PlainTextLang) return 1;
    return 0;
}
