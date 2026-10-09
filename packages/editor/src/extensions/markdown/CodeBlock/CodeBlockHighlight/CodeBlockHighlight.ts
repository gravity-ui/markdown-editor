import type {Node} from 'prosemirror-model';
import {Plugin, PluginKey} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {findChildrenByType} from 'prosemirror-utils';
import {Decoration, DecorationSet} from 'prosemirror-view';

import type {ExtensionAuto} from '#core';

import {
    CodeBlockNodeAttr,
    type LineNumbersOptions,
    codeBlockNodeName,
    codeBlockType,
} from '../CodeBlockSpecs';

import {CodeBlockNodeView} from './CodeBlockNodeView';
import {codeLangSelectTooltipViewCreator} from './TooltipPlugin';
import {
    type HighlightLangMap,
    type LLRoot,
    type Lowlight,
    codeBlockLangsPlugin,
    codeBlockLangsPluginKey,
    getCodeBlockLangsState,
} from './plugins/codeBlockLangsPlugin';
import {codeBlockLineNumbersPlugin} from './plugins/codeBlockLineNumbersPlugin';
import {codeBlockLineWrappingPlugin} from './plugins/codeBlockLineWrappingPlugin';
import {processChangedCodeBlocks} from './utils';

import './CodeBlockHighlight.scss';

export type {HighlightLangMap};

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
    if (opts.lineWrapping?.enabled) builder.addPlugin(codeBlockLineWrappingPlugin);
    if (opts.lineNumbers?.enabled) builder.addPlugin(codeBlockLineNumbersPlugin);

    builder.addPlugin(() => codeBlockLangsPlugin(opts.langs, builder.logger));

    builder.addPlugin(() => {
        // TODO: add TAB key handler
        // TODO: Remove constant selection of block
        return new Plugin<PluginState>({
            key: pluginKey,
            state: {
                init: (_config, _state) => {
                    const cache: HighlightCache = new WeakMap();
                    return {cache, decoSet: DecorationSet.empty};
                },
                apply: (tr, {cache, decoSet}, _oldState, newState) => {
                    const langsUpdate = tr.getMeta(codeBlockLangsPluginKey);
                    if (langsUpdate?.loaded && langsUpdate.lowlight) {
                        return {
                            cache,
                            decoSet: getDecorations(tr.doc, cache, langsUpdate.lowlight),
                        };
                    }

                    const {lowlight} = getCodeBlockLangsState(newState);

                    if (!lowlight) {
                        return {cache, decoSet: DecorationSet.empty};
                    }

                    if (!tr.docChanged) return {cache, decoSet};

                    decoSet = processChangedCodeBlocks(tr, decoSet, (node, pos, decoSet) => {
                        const lang: string | undefined = node.attrs[CodeBlockNodeAttr.Lang];

                        if (!lang || !lowlight.registered(lang)) {
                            return decoSet.remove(decoSet.find(pos, pos + node.nodeSize));
                        }

                        const cached = cache.get(node);
                        if (cached) {
                            // node is in cache, but decorations may be missing (for example, after undo)
                            if (!decoSet.find(pos, pos + node.nodeSize).length) {
                                return decoSet.add(tr.doc, renderTree(cached, pos + 1));
                            }
                            return decoSet;
                        }

                        decoSet = decoSet.remove(decoSet.find(pos, pos + node.nodeSize));
                        const ast = lowlight.highlight(lang, node.textContent);
                        const parsed = parseNodes(ast.children);
                        cache.set(node, parsed);
                        return decoSet.add(tr.doc, renderTree(parsed, pos + 1));
                    });

                    return {cache, decoSet};
                },
            },
            view: (view) => {
                return codeLangSelectTooltipViewCreator(view, {
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

    function getDecorations(doc: Node, cache: HighlightCache, lowlight: Lowlight) {
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
    nodes: LLRoot['children'],
    className: readonly string[] = [],
): HighlightParsedTree {
    const result: HighlightParsedTree = [];
    collectNodes(nodes, className, result);
    return result;
}

function collectNodes(
    nodes: LLRoot['children'],
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
