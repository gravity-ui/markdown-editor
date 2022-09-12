import type {NodeSpec} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';
import {setBlockType} from 'prosemirror-commands';
import {hasParentNodeOfType} from 'prosemirror-utils';
import {Action, createExtension, ExtensionAuto} from '../../../core';
import {nodeTypeFactory} from '../../../utils/schema';

export enum BaseNode {
    Doc = 'doc',
    Text = 'text',
    Paragraph = 'paragraph',
}

export const pType = nodeTypeFactory(BaseNode.Paragraph);
const pAction = 'toParagraph';

export const toParagraph: Command = (state, dispatch) =>
    setBlockType(pType(state.schema))(state, dispatch);

export type BaseSchemaOptions = {
    paragraphKey?: string | null;
    paragraphPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const BaseSchema: ExtensionAuto<BaseSchemaOptions> = (builder, opts) => {
    const {paragraphKey, paragraphPlaceholder} = opts;

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
                content: '(text | inline)*',
                group: 'block',
                parseDOM: [{tag: 'p'}],
                toDOM() {
                    return ['p', 0];
                },
                placeholder: paragraphPlaceholder
                    ? {
                          content: paragraphPlaceholder,
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

    if (paragraphKey) {
        builder.addKeymap(({schema}) => ({[paragraphKey]: setBlockType(pType(schema))}));
    }

    builder.addAction(pAction, ({schema}) => {
        const p = pType(schema);
        const cmd = setBlockType(p);
        return {
            isActive: (state) => hasParentNodeOfType(p)(state.selection),
            isEnable: cmd,
            run: cmd,
        };
    });
};

/**
 * @deprecated
 * For tests only.
 * Remove after WIKI-16660
 */
export const BaseSchemaE = createExtension<BaseSchemaOptions>((b, o) => b.use(BaseSchema, o ?? {}));

declare global {
    namespace YfmEditor {
        interface Actions {
            [pAction]: Action;
        }
    }
}
