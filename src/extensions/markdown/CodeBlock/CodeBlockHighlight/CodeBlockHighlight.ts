import type {Options} from '@diplodoc/transform';
// importing only type, because lowlight and highlight.js is optional deps
import type HLJS from 'highlight.js/lib/core';
import type {createLowlight} from 'lowlight' with {'resolution-mode': 'import'};
import type {Node} from 'prosemirror-model';
import {Plugin, PluginKey} from 'prosemirror-state';
import type {Step} from 'prosemirror-transform';
// @ts-ignore // TODO: fix cjs build
import {findChildrenByType} from 'prosemirror-utils';
import {Decoration, DecorationSet} from 'prosemirror-view';

import type {ExtensionAuto} from '../../../../core';
import {capitalize} from '../../../../lodash';
import {globalLogger} from '../../../../logger';
import {
    CodeBlockNodeAttr,
    type LineNumbersOptions,
    codeBlockNodeName,
    codeBlockType,
} from '../CodeBlockSpecs';

import {codeLangSelectTooltipViewCreator} from './TooltipPlugin';

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

    builder.addPlugin(() => {
        let modulesLoaded = false;

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
                        }
                    });
                    return getDecorations(state.doc);
                },
                apply: (tr, decos, oldState, newState) => {
                    if (!modulesLoaded) {
                        return DecorationSet.empty;
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
            view: (view) =>
                codeLangSelectTooltipViewCreator(
                    view,
                    selectItems,
                    mapping,
                    Boolean(opts.lineNumbers?.enabled),
                ),
            props: {
                decorations: (state) => {
                    return key.getState(state);
                },
                nodeViews: {
                    [codeBlockNodeName]: (node) => {
                        let prevLang = node.attrs[CodeBlockNodeAttr.Lang];

                        const dom = document.createElement('pre');
                        updateDomAttribute(
                            dom,
                            CodeBlockNodeAttr.Line,
                            node.attrs[CodeBlockNodeAttr.Line],
                        );

                        const code = document.createElement('code');
                        code.classList.add('hljs');

                        if (prevLang) {
                            dom.setAttribute(CodeBlockNodeAttr.Lang, prevLang);
                            code.classList.add(prevLang);
                        }

                        const contentDOM = document.createElement('div');

                        let lineNumbersContainer: HTMLDivElement | undefined;
                        let prevLineCount = 0;

                        if (opts.lineNumbers?.enabled) {
                            const result = initializeLineNumbers(node, code);
                            lineNumbersContainer = result.container;
                            prevLineCount = result.lineCount;
                        }

                        code.append(contentDOM);
                        dom.append(code);

                        return {
                            dom,
                            contentDOM,
                            update(newNode) {
                                if (node.type !== newNode.type) return false;

                                const newLang = newNode.attrs[CodeBlockNodeAttr.Lang];
                                if (prevLang !== newLang) {
                                    code.className = 'hljs';
                                    updateDomAttribute(dom, CodeBlockNodeAttr.Lang, newLang);
                                    if (newLang) {
                                        code.classList.add(newLang);
                                    }
                                    prevLang = newLang;
                                }

                                updateDomAttribute(
                                    dom,
                                    CodeBlockNodeAttr.Line,
                                    newNode.attrs[CodeBlockNodeAttr.Line],
                                );

                                if (opts.lineNumbers?.enabled) {
                                    const result = updateLineNumbers(
                                        newNode,
                                        code,
                                        lineNumbersContainer,
                                        prevLineCount,
                                    );
                                    lineNumbersContainer = result.container;
                                    prevLineCount = result.lineCount;
                                }

                                return true;
                            },
                        };
                    },
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

function updateDomAttribute(elem: Element, attr: string, value: string | null | undefined) {
    if (value) {
        elem.setAttribute(attr, value);
    } else {
        elem.removeAttribute(attr);
    }
}
function initializeLineNumbers(
    node: Node,
    code: HTMLElement,
): {container?: HTMLDivElement; lineCount: number} {
    const showLineNumbers = node.attrs[CodeBlockNodeAttr.ShowLineNumbers];

    if (!showLineNumbers) {
        return {container: undefined, lineCount: 0};
    }

    const lineNumbersContainer = document.createElement('div');
    lineNumbersContainer.className = 'yfm-line-numbers';
    lineNumbersContainer.contentEditable = 'false';

    const lines = node.textContent ? node.textContent.split('\n') : [''];
    const lineCount = lines.length;

    appendLineNumbers(lineNumbersContainer, 1, lineCount);

    code.prepend(lineNumbersContainer);
    code.classList.add('show-line-numbers');

    return {container: lineNumbersContainer, lineCount};
}

function updateLineNumbers(
    node: Node,
    code: HTMLElement,
    prevLineNumbersContainer?: HTMLDivElement,
    prevLineCount = 0,
): {container?: HTMLDivElement; lineCount: number} {
    const showLineNumbers = node.attrs[CodeBlockNodeAttr.ShowLineNumbers];

    if (!prevLineNumbersContainer && showLineNumbers !== 'true') {
        return {container: undefined, lineCount: 0};
    } else if (!prevLineNumbersContainer && showLineNumbers === 'true') {
        return initializeLineNumbers(node, code);
    } else if (prevLineNumbersContainer && showLineNumbers !== 'true') {
        code.removeChild(prevLineNumbersContainer);
        code.classList.remove('show-line-numbers');
        return {container: undefined, lineCount: 0};
    }

    if (!prevLineNumbersContainer) {
        return {container: prevLineNumbersContainer, lineCount: prevLineCount};
    }

    const lines = node.textContent ? node.textContent.split('\n') : [''];
    const currentLineCount = lines.length;

    code.classList.add('show-line-numbers');

    if (currentLineCount === prevLineCount) {
        return {container: prevLineNumbersContainer, lineCount: prevLineCount};
    }

    if (currentLineCount > prevLineCount) {
        appendLineNumbers(prevLineNumbersContainer, prevLineCount + 1, currentLineCount);
    } else if (currentLineCount < prevLineCount) {
        removeExcessLineNumbers(prevLineNumbersContainer, currentLineCount, prevLineCount);
    }

    return {container: prevLineNumbersContainer, lineCount: currentLineCount};
}

function appendLineNumbers(container: HTMLDivElement, startLine: number, endLine: number) {
    const maxDigits = String(endLine).length;

    for (let i = startLine; i <= endLine; i++) {
        const lineNumberElement = document.createElement('div');
        lineNumberElement.className = 'yfm-line-number';
        lineNumberElement.textContent = String(i).padStart(maxDigits, ' ');
        container.appendChild(lineNumberElement);
    }

    // Update padding on all line numbers if digit count changed
    if (startLine === 1) {
        updateLineNumberPadding(container, maxDigits);
    }
}

function removeExcessLineNumbers(container: HTMLDivElement, keepCount: number, prevCount: number) {
    for (let i = prevCount; i > keepCount; i--) {
        if (container.lastChild) {
            container.removeChild(container.lastChild);
        }
    }

    // Update padding on remaining line numbers if digit count changed
    const maxDigits = String(keepCount).length;
    updateLineNumberPadding(container, maxDigits);
}

function updateLineNumberPadding(container: HTMLDivElement, maxDigits: number) {
    Array.from(container.children).forEach((lineNumber, index) => {
        const lineNum = index + 1;
        lineNumber.textContent = String(lineNum).padStart(maxDigits, ' ');
    });
}
