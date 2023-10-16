import type {NodeSpec} from 'prosemirror-model';
import type {ExtensionAuto} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';
import {processPlaceholderContent, PlaceholderOptions} from '../../../../utils/placeholder';

export enum BaseNode {
    Doc = 'doc',
    Text = 'text',
    Paragraph = 'paragraph',
}

export const pType = nodeTypeFactory(BaseNode.Paragraph);

export type BaseSchemaSpecsOptions = {
    /**
     * @deprecated: use placeholderOptions instead.
     */
    paragraphPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
    placeholderOptions?: PlaceholderOptions;
};

export const BaseSchemaSpecs: ExtensionAuto<BaseSchemaSpecsOptions> = (builder, opts) => {
    const {placeholderOptions, paragraphPlaceholder} = opts;
    const placeholderContent =
        processPlaceholderContent(placeholderOptions?.[BaseNode.Paragraph]) ?? paragraphPlaceholder;
    builder
        .addNode(BaseNode.Doc, () => ({
            spec: {
                content: 'block+',
            },
            fromYfm: {tokenSpec: {name: BaseNode.Doc, type: 'block', ignore: true}},
            toYfm: () => {
                throw new Error('Unexpected toYfm() call on doc node');
            },
        }))
        .addNode(BaseNode.Text, () => ({
            spec: {
                group: 'inline',
            },
            fromYfm: {tokenSpec: {name: BaseNode.Text, type: 'node', ignore: true}},
            toYfm: (state, node, parent) => {
                const {escapeText} = parent.type.spec;
                state.text(node.text, escapeText ?? !state.isAutolink);
            },
        }))
        .addNode(BaseNode.Paragraph, () => ({
            spec: {
                content: 'inline*',
                group: 'block',
                parseDOM: [{tag: 'p'}],
                toDOM() {
                    return ['p', 0];
                },
                placeholder: placeholderContent
                    ? {
                          content: placeholderContent,
                          alwaysVisible: false,
                      }
                    : undefined,
            },
            fromYfm: {tokenSpec: {name: BaseNode.Paragraph, type: 'block'}},
            toYfm: (state, node) => {
                state.renderInline(node);
                state.closeBlock(node);
            },
        }));
};
