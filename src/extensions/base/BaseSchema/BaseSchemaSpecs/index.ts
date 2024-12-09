import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

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
    allowEmptyRows?: boolean;
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
                state.text(node.text, escapeText ?? !state.isAutolink);
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
                placeholder: opts.paragraphPlaceholder
                    ? {
                          content: opts.paragraphPlaceholder,
                          alwaysVisible: false,
                      }
                    : undefined,
            },
            fromMd: {tokenSpec: {name: BaseNode.Paragraph, type: 'block'}},
            toMd: (state, node, parent) => {
                if (opts.allowEmptyRows && !node.content.size) {
                    const isParentEmpty = parent.content.size / parent.content.childCount === 2;
                    if (!isParentEmpty) {
                        state.write('&nbsp;\n\n');
                    }
                } else {
                    state.renderInline(node);
                    state.closeBlock(node);
                }
            },
        }));
};
