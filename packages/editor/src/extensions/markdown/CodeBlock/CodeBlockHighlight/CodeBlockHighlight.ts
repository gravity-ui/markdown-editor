import type {Options} from '@diplodoc/transform';
// importing only type, because lowlight and highlight.js is optional deps
import type HLJS from 'highlight.js/lib/core';
import type {createLowlight} from 'lowlight' with {'resolution-mode': 'import'};
import type {Node} from 'prosemirror-model';
import {Plugin, PluginKey} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {findChildrenByType} from 'prosemirror-utils';
import {Decoration, DecorationSet, type EditorView} from 'prosemirror-view';

import type {ExtensionAuto} from '../../../../core';
import {capitalize} from '../../../../lodash';
import {globalLogger} from '../../../../logger';
import {
    CodeBlockNodeAttr,
    type LineNumbersOptions,
    codeBlockNodeName,
    codeBlockType,
} from '../CodeBlockSpecs';

import {CodeBlockNodeView} from './CodeBlockNodeView';
import {codeLangSelectTooltipViewCreator} from './TooltipPlugin';
import {PlainTextLang} from './const';
import {codeBlockLineNumbersPlugin} from './plugins/codeBlockLineNumbersPlugin';
import {codeBlockLineWrappingPlugin} from './plugins/codeBlockLineWrappingPlugin';
import {getChangedRanges} from './utils';

import './CodeBlockHighlight.scss';

export type HighlightLangMap = Options['highlightLangs'];

type Lowlight = ReturnType<typeof createLowlight>;
type Root = ReturnType<Lowlight['highlight']>;

type LangSelectItem = {
    value: string;
    content: string;
};

const pluginKey = new PluginKey<PluginState>('code_block_highlight');

// Cache for parsed highlight results, using ProseMirror nodes as keys
type HighlightCache = WeakMap<Node, HighlightParsedTree>;

type HighlightParsedTree = {text: string; classes: readonly string[]}[];

type PluginState = {
    cache: HighlightCache;
    decoSet: DecorationSet;
};

export type CodeBlockHighlightOptions = {
    lineWrapping?: {
        enabled?: boolean;
    };
    lineNumbers?: LineNumbersOptions;
    langs?: HighlightLangMap;
};

export const CodeBlockHighlight: ExtensionAuto<CodeBlockHighlightOptions> = (builder, opts) => {
    let langs: NonNullable<HighlightLangMap>;
    let lowlight: Lowlight;
    let hljs: typeof HLJS;

    const loadModules = async () => {
        try {
            hljs = (await import('highlight.js/lib/core')).default;
            const low = await import('lowlight');

            const all: HighlightLangMap = low.all;
            const create: typeof createLowlight = low.createLowlight;
            langs = {...all, ...opts.langs};
            lowlight = create(langs);
            return true;
        } catch (e) {
            globalLogger.info('Skip code_block highlighting');
            builder.logger.log('Skip code_block highlighting');
            return false;
        }
    };

    if (opts.lineWrapping?.enabled) builder.addPlugin(codeBlockLineWrappingPlugin);
    if (opts.lineNumbers?.enabled) builder.addPlugin(codeBlockLineNumbersPlugin);

    builder.addPlugin(() => {
        let modulesLoaded = false;
        let view: EditorView | null = null;

        // empty array by default, but is filled after loading modules
        const selectItems: LangSelectItem[] = [];
        const mapping: Record<string, string> = {};

        // TODO: add TAB key handler
        // TODO: Remove constant selection of block
        return new Plugin<PluginState>({
            key: pluginKey,
            state: {
                init: (_, state) => {
                    loadModules().then((loaded) => {
                        modulesLoaded = loaded;

                        if (modulesLoaded) {
                            for (const lang of Object.keys(langs)) {
                                const defs = langs[lang](hljs);
                                selectItems.push({
                                    value: lang,
                                    content: defs.name || capitalize(lang),
                                });
                                if (defs.aliases) {
                                    for (const alias of defs.aliases) {
                                        mapping[alias] = lang;
                                    }
                                }
                            }

                            selectItems.sort(sortLangs);

                            if (view && !view.isDestroyed) {
                                view.dispatch(view.state.tr.setMeta(pluginKey, {modulesLoaded}));
                            }
                        }
                    });

                    const cache: HighlightCache = new WeakMap();

                    return {
                        cache,
                        decoSet: modulesLoaded
                            ? DecorationSet.empty
                            : getDecorations(state.doc, cache),
                    };
                },
                apply: (tr, {cache, decoSet}) => {
                    if (!modulesLoaded) {
                        return {cache, decoSet: DecorationSet.empty};
                    }

                    if (tr.getMeta(pluginKey)?.modulesLoaded) {
                        return {cache, decoSet: getDecorations(tr.doc, cache)};
                    }

                    if (!tr.docChanged) return {cache, decoSet};

                    decoSet = decoSet.map(tr.mapping, tr.doc);

                    const changedRanges = getChangedRanges(tr);

                    for (const {from, to} of changedRanges) {
                        // eslint-disable-next-line @typescript-eslint/no-loop-func
                        tr.doc.nodesBetween(from, to, (node, pos) => {
                            if (node.type.name !== codeBlockNodeName) return true;

                            const lang: string | undefined = node.attrs[CodeBlockNodeAttr.Lang];

                            if (!lang || !lowlight.registered(lang)) {
                                decoSet = decoSet.remove(decoSet.find(pos, pos + node.nodeSize));
                                return false;
                            }

                            const cached = cache.get(node);
                            if (cached) {
                                // node is in cache, but decorations may be missing (for example, after undo)
                                if (!decoSet.find(pos, pos + node.nodeSize).length) {
                                    decoSet = decoSet.add(tr.doc, renderTree(cached, pos + 1));
                                }
                            } else {
                                decoSet = decoSet.remove(decoSet.find(pos, pos + node.nodeSize));

                                const ast = lowlight.highlight(lang, node.textContent);
                                const parsed = parseNodes(ast.children);
                                cache.set(node, parsed);
                                decoSet = decoSet.add(tr.doc, renderTree(parsed, pos + 1));
                            }
                            return false;
                        });
                    }

                    return {cache, decoSet};
                },
            },
            view: (v) => {
                view = v;
                return codeLangSelectTooltipViewCreator(view, selectItems, mapping, {
                    showCodeWrapping: Boolean(opts.lineWrapping?.enabled),
                    showLineNumbers: Boolean(opts.lineNumbers?.enabled),
                });
            },
            props: {
                decorations(state) {
                    return pluginKey.getState(state)?.decoSet;
                },
                nodeViews: {
                    [codeBlockNodeName]: CodeBlockNodeView.withOpts(opts),
                },
            },
        });
    });

    function getDecorations(doc: Node, cache: HighlightCache) {
        if (!lowlight) {
            return DecorationSet.empty;
        }

        const decos: Decoration[] = [];

        for (const {node, pos} of findChildrenByType(doc, codeBlockType(doc.type.schema), true)) {
            const lang: string | undefined = node.attrs[CodeBlockNodeAttr.Lang];
            if (!lang || !lowlight.registered(lang)) {
                continue;
            }

            // Try to get parsed result from cache using node as key
            let parsedNodes = cache.get(node);
            if (!parsedNodes) {
                // Compute, parse and cache using the node itself as key
                const nodes = lowlight.highlight(lang, node.textContent).children;
                parsedNodes = parseNodes(nodes);
                cache.set(node, parsedNodes);
            }

            decos.push(...renderTree(parsedNodes, pos + 1));
        }

        return DecorationSet.create(doc, decos);
    }
};

function renderTree(parsedNodes: HighlightParsedTree, from: number): Decoration[] {
    const decos: Decoration[] = [];

    for (const {text, classes} of parsedNodes) {
        const to = from + text.length;
        if (classes.length) {
            decos.push(
                Decoration.inline(from, to, {
                    class: classes.join(' '),
                }),
            );
        }
        from = to;
    }

    return decos;
}

function parseNodes(
    nodes: Root['children'],
    className: readonly string[] = [],
): HighlightParsedTree {
    const result: HighlightParsedTree = [];
    collectNodes(nodes, className, result);
    return result;
}

function collectNodes(
    nodes: Root['children'],
    className: readonly string[],
    result: HighlightParsedTree,
): void {
    for (const node of nodes) {
        if (node.type === 'element') {
            const classes = className.concat((node.properties.className as string[]) ?? []);
            collectNodes(node.children, classes, result);
        } else {
            result.push({
                text: node.type === 'comment' || node.type === 'text' ? node.value : '',
                classes: className,
            });
        }
    }
}

function sortLangs(a: LangSelectItem, b: LangSelectItem): number {
    // plaintext always goes first
    if (a.value === PlainTextLang) return -1;
    if (b.value === PlainTextLang) return 1;
    return 0;
}
