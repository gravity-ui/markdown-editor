import type {Options} from '@diplodoc/transform';
// importing only type, because lowlight and highlight.js is optional deps
import type HLJS from 'highlight.js/lib/core';
import type {createLowlight} from 'lowlight' with {'resolution-mode': 'import'};
import type {Node} from 'prosemirror-model';
import {Plugin, PluginKey} from 'prosemirror-state';
import type {Step} from 'prosemirror-transform';
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

import './CodeBlockHighlight.scss';

export type HighlightLangMap = Options['highlightLangs'];

type Lowlight = ReturnType<typeof createLowlight>;
type Root = ReturnType<Lowlight['highlight']>;

type LangSelectItem = {
    value: string;
    content: string;
};

const key = new PluginKey<DecorationSet>('code_block_highlight');

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
        return new Plugin<DecorationSet>({
            key,
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
                                view.dispatch(view.state.tr.setMeta(key, {modulesLoaded}));
                            }
                        }
                    });
                    return getDecorations(state.doc);
                },
                apply: (tr, decos, oldState, newState) => {
                    if (!modulesLoaded) {
                        return DecorationSet.empty;
                    }

                    if (tr.getMeta(key)?.modulesLoaded) {
                        return getDecorations(tr.doc);
                    }

                    if (tr.docChanged) {
                        const oldNodeName = oldState.selection.$head.parent.type.name;
                        const newNodeName = newState.selection.$head.parent.type.name;

                        // Apply decorations if:
                        if (
                            oldNodeName === codeBlockNodeName ||
                            newNodeName === codeBlockNodeName
                        ) {
                            // selection includes codeblock node,
                            return getDecorations(tr.doc);
                        } else {
                            const oldNodes = findChildrenByType(
                                oldState.doc,
                                codeBlockType(oldState.schema),
                            );
                            const newNodes = findChildrenByType(
                                newState.doc,
                                codeBlockType(newState.schema),
                            );
                            if (
                                // OR transaction adds/removes codeblock nodes,
                                newNodes.length !== oldNodes.length ||
                                // OR transaction has changes that completely encapsulate a node
                                // (for example, a transaction that affects the entire document).
                                // Such transactions can happen during collab syncing via y-prosemirror, for example.
                                tr.steps.some((step) => {
                                    return (
                                        stepHasFromTo(step) &&
                                        oldNodes.some(
                                            (node: {node: Node; pos: number}) =>
                                                node.pos >= step.from &&
                                                node.pos + node.node.nodeSize <= step.to,
                                        )
                                    );
                                })
                            ) {
                                return getDecorations(tr.doc);
                            }
                        }
                    }
                    return decos.map(tr.mapping, tr.doc);
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
                decorations: (state) => {
                    return key.getState(state);
                },
                nodeViews: {
                    [codeBlockNodeName]: CodeBlockNodeView.withOpts(opts),
                },
            },
        });
    });

    function getDecorations(doc: Node) {
        const decos: Decoration[] = [];

        if (!lowlight) {
            return DecorationSet.empty;
        }

        for (const {node, pos} of findChildrenByType(doc, codeBlockType(doc.type.schema), true)) {
            let from = pos + 1;
            let nodes: Root['children'];

            const lang: string | undefined = node.attrs[CodeBlockNodeAttr.Lang];
            if (lang && lowlight.registered(lang)) {
                nodes = lowlight.highlight(lang, node.textContent).children;
            } else {
                continue;
            }

            for (const {text, classes} of parseNodes(nodes)) {
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
        }

        return DecorationSet.create(doc, decos);
    }
};

function parseNodes(
    nodes: Root['children'],
    className: readonly string[] = [],
): {text: string; classes: readonly string[]}[] {
    return nodes
        .map((node) => {
            let classes = className;
            if (node.type === 'element') {
                classes = classes.concat((node.properties.className as string[]) ?? []);
                return parseNodes(node.children, classes);
            }

            return {
                text: node.type === 'comment' || node.type === 'text' ? node.value : '',
                classes,
            };
        })
        .flat();
}

function stepHasFromTo(step: Step): step is Step & {from: number; to: number} {
    // @ts-expect-error
    return typeof step.from === 'number' && typeof step.to === 'number';
}

function sortLangs(a: LangSelectItem, b: LangSelectItem): number {
    // plaintext always goes first
    if (a.value === PlainTextLang) return -1;
    if (b.value === PlainTextLang) return 1;
    return 0;
}
