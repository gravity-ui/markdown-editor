import type {ExtensionAuto, ExtensionNodeSpec} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

export const CodeBlockNodeAttr = {
    Lang: 'data-language',
    Markup: 'data-markup',
    Line: 'data-line',
    ShowLineNumbers: 'data-show-line-numbers',
} as const;

export const codeBlockNodeName = 'code_block';
export const codeBlockType = nodeTypeFactory(codeBlockNodeName);

export type LineNumbersOptions = {enabled?: boolean; showByDefault?: boolean};

export type CodeBlockSpecsOptions = {
    nodeview?: ExtensionNodeSpec['view'];
    lineNumbers?: LineNumbersOptions;
};

const getLangOfNode = (node: Element) => {
    let result = node.getAttribute(CodeBlockNodeAttr.Lang) || '';

    if (!result) {
        const firstElementChild = node.firstElementChild;

        if (
            firstElementChild &&
            firstElementChild.nodeName.toLowerCase() === 'code' &&
            firstElementChild.classList.contains('hljs')
        ) {
            result = firstElementChild.getAttribute('class')?.split(' ')?.[1] || '';
        }
    }

    return result;
};

export const CodeBlockSpecs: ExtensionAuto<CodeBlockSpecsOptions> = (builder, opts) => {
    builder.addNode(codeBlockNodeName, () => ({
        view: opts.nodeview,
        spec: {
            attrs: {
                [CodeBlockNodeAttr.Lang]: {default: ''},
                [CodeBlockNodeAttr.Markup]: {default: '```'},
                [CodeBlockNodeAttr.Line]: {default: null},
                ...(opts.lineNumbers?.enabled
                    ? {
                          [CodeBlockNodeAttr.ShowLineNumbers]: {
                              default: opts.lineNumbers.showByDefault ? 'true' : '',
                          },
                      }
                    : {}),
            },
            content: 'text*',
            group: 'block',
            code: true,
            marks: '',
            selectable: true,
            allowSelection: false,
            parseDOM: [
                {
                    tag: 'pre',
                    preserveWhitespace: 'full',
                    getAttrs: (node) => {
                        return {
                            [CodeBlockNodeAttr.Lang]: getLangOfNode(node as Element),
                        };
                    },
                },
            ],
            toDOM({attrs}) {
                return ['pre', attrs, ['code', 0]];
            },
        },
        fromMd: {
            tokenSpec: {
                name: codeBlockNodeName,
                type: 'block',
                noCloseToken: true,
                getAttrs: (tok) => {
                    return {
                        [CodeBlockNodeAttr.Line]: tok.attrGet('data-line'),
                        [CodeBlockNodeAttr.ShowLineNumbers]: tok.info.includes('showLineNumbers')
                            ? 'true'
                            : '',
                    };
                },
                prepareContent: removeNewLineAtEnd, // content of code blocks contains extra \n at the end
            },
        },
        toMd: (state, node) => {
            const lang: string = node.attrs[CodeBlockNodeAttr.Lang];
            const markup: string = node.attrs[CodeBlockNodeAttr.Markup];
            const showLineNumbers: string = opts.lineNumbers?.enabled
                ? node.attrs[CodeBlockNodeAttr.ShowLineNumbers]
                : '';

            let info = lang;

            if (showLineNumbers === 'true') {
                info += ' showLineNumbers';
            }

            state.write(markup + info + '\n');
            state.text(node.textContent, false);
            // Add a newline to the current content before adding closing marker
            state.write('\n');
            state.write(markup);
            state.closeBlock(node);
        },
    }));
    builder.addNode('fence', () => ({
        //  we adding this node only for define specific 'fence' parser token,
        //  which parse fence md token to code_block node
        spec: {},
        fromMd: {
            tokenSpec: {
                name: codeBlockNodeName,
                type: 'block',
                noCloseToken: true,
                getAttrs: (tok) => {
                    const attrs: Record<string, string | null> = {
                        [CodeBlockNodeAttr.Markup]: tok.markup,
                        [CodeBlockNodeAttr.Line]: tok.attrGet('data-line'),
                    };
                    if (tok.info) {
                        // like in markdown-it
                        // https://github.com/markdown-it/markdown-it/blob/d07d585b6b15aaee2bc8f7a54b994526dad4dbc5/lib/renderer.mjs#L36-L37
                        const parts = tok.info.split(/\s+/);

                        const isFirstPartForLineNumbers =
                            opts.lineNumbers?.enabled && parts[0] === 'showLineNumbers';

                        attrs[CodeBlockNodeAttr.Lang] = isFirstPartForLineNumbers ? '' : parts[0];
                    }
                    if (opts.lineNumbers?.enabled && tok.info?.includes('showLineNumbers')) {
                        attrs[CodeBlockNodeAttr.ShowLineNumbers] = 'true';
                    } else {
                        attrs[CodeBlockNodeAttr.ShowLineNumbers] = '';
                    }

                    return attrs;
                },
                prepareContent: removeNewLineAtEnd, // content of fence blocks contains extra \n at the end
            },
        },
        toMd: () => {
            throw new Error('Unexpected toMd() call on fence node');
        },
    }));
    builder.addKeymap(() => ({
        Tab: (state, dispatch) => {
            const {$anchor, $head} = state.selection;
            if ($anchor.sameParent($head) && $anchor.parent.type.name === codeBlockNodeName) {
                dispatch?.(state.tr.replaceSelectionWith(state.schema.text('\t')).scrollIntoView());
                return true;
            }
            return false;
        },
    }));
};

function removeNewLineAtEnd(content: string): string {
    return content.endsWith('\n') ? content.slice(0, content.length - 1) : content;
}
