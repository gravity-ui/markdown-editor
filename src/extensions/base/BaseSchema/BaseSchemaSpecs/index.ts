import type {ExtensionAuto} from '#core';
import type {NodeSpec} from '#pm/model';
import {isEmptyString} from 'src/utils/nodes';
import {nodeTypeFactory} from 'src/utils/schema';

export enum BaseNode {
    Doc = 'doc',
    Text = 'text',
    Paragraph = 'paragraph',
}

const paragraphLineNumberAttr = 'data-line';

export const pType = nodeTypeFactory(BaseNode.Paragraph);

export type BaseSchemaSpecsOptions = {
    // This cannot be passed through placeholder option of BehaviorPreset because BasePreset initializes first
    paragraphPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
    preserveEmptyRows?: boolean;
};

export const BaseSchemaSpecs: ExtensionAuto<BaseSchemaSpecsOptions> = (builder, opts) => {
    builder
        .addNode(BaseNode.Doc, () => ({
            spec: {
                content: 'block+',
            },
            fromMd: {tokenSpec: {name: BaseNode.Doc, type: 'block', ignore: true}},
            toMd: () => {
                throw new Error('Unexpected toMd() call on doc node');
            },
        }))
        .addNode(BaseNode.Text, () => ({
            spec: {
                group: 'inline',
            },
            fromMd: {tokenSpec: {name: BaseNode.Text, type: 'node', ignore: true}},
            toMd: (state, node, parent) => {
                const {escapeText} = parent.type.spec;
                state.text(node.text ?? '', escapeText ?? !state.isAutolink);
            },
        }))
        .addNode(BaseNode.Paragraph, () => ({
            spec: {
                attrs: {[paragraphLineNumberAttr]: {default: null}},
                content: 'inline*',
                group: 'block',
                parseDOM: [{tag: 'p'}],
                toDOM(node) {
                    const lineNumber = node.attrs[paragraphLineNumberAttr];

                    return [
                        'p',
                        lineNumber === null ? {} : {[paragraphLineNumberAttr]: lineNumber},
                        0,
                    ];
                },
                selectable: true,
                placeholder: opts.paragraphPlaceholder
                    ? {
                          content: opts.paragraphPlaceholder,
                          alwaysVisible: false,
                      }
                    : undefined,
            },
            fromMd: {tokenSpec: {name: BaseNode.Paragraph, type: 'block'}},
            toMd: (state, node, parent) => {
                /*
                    An empty line is added only if there is some content in the parent element.
                    This is necessary in order to prevent an empty document with empty lines
                */
                if (opts.preserveEmptyRows && isEmptyString(node)) {
                    let isParentEmpty = true;

                    for (let index = 0; index < parent.content.childCount; index++) {
                        const parentChild = parent.content.child(index);
                        if (
                            parentChild.content.size !== 0 ||
                            parentChild.type.name !== 'paragraph'
                        ) {
                            isParentEmpty = false;
                        }
                    }

                    if (!isParentEmpty) {
                        state.write('&nbsp;\n');
                        state.write('\n');
                    }
                } else {
                    state.renderInline(node);
                    state.closeBlock(node);
                }
            },
        }));
};
