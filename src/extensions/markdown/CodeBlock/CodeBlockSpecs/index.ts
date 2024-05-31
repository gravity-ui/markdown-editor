import type {ExtensionAuto, ExtensionNodeSpec} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

export const CodeBlockNodeAttr = {
    Lang: 'data-language',
    Markup: 'data-markup',
} as const;

export const codeBlockNodeName = 'code_block';
/** @deprecated Use __CodeBlockNodeAttr__ instead */
export const codeBlockLangAttr = CodeBlockNodeAttr.Lang;
export const codeBlockType = nodeTypeFactory(codeBlockNodeName);

export type CodeBlockSpecsOptions = {
    nodeview?: ExtensionNodeSpec['view'];
};

const getLangOfNode = (node: Element) => {
    return (
        node.getAttribute(CodeBlockNodeAttr.Lang) ||
        node.firstElementChild?.getAttribute('class')?.split(' ')?.[1] ||
        ''
    );
};

export const CodeBlockSpecs: ExtensionAuto<CodeBlockSpecsOptions> = (builder, opts) => {
    builder.addNode(codeBlockNodeName, () => ({
        view: opts.nodeview,
        spec: {
            attrs: {
                [CodeBlockNodeAttr.Lang]: {default: ''},
                [CodeBlockNodeAttr.Markup]: {default: '```'},
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
                        console.log('node', node);
                        return {
                            [CodeBlockNodeAttr.Lang]: getLangOfNode(node as Element),
                        };
                    },
                },
            ],
            toDOM({attrs}) {
                console.log('attrs', attrs);
                return ['pre', attrs, ['code', 0]];
            },
        },
        fromMd: {
            tokenSpec: {
                name: codeBlockNodeName,
                type: 'block',
                noCloseToken: true,
                prepareContent: removeNewLineAtEnd, // content of code blocks contains extra \n at the end
            },
        },
        toMd: (state, node) => {
            const lang: string = node.attrs[CodeBlockNodeAttr.Lang];
            const markup: string = node.attrs[CodeBlockNodeAttr.Markup];

            state.write(markup + lang + '\n');
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
                    const attrs: Record<string, string> = {
                        [CodeBlockNodeAttr.Markup]: tok.markup,
                    };
                    if (tok.info) {
                        // like in markdown-it
                        // https://github.com/markdown-it/markdown-it/blob/d07d585b6b15aaee2bc8f7a54b994526dad4dbc5/lib/renderer.mjs#L36-L37
                        attrs[CodeBlockNodeAttr.Lang] = tok.info.split(/(\s+)/g)[0];
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
