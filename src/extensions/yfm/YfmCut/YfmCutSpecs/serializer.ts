import type {SerializerNodeToken} from '#core';
import type {Node} from '#pm/model';
import {isNodeEmpty} from 'src/utils/nodes';
import {getPlaceholderContent} from 'src/utils/placeholder';

import {CutAttr, CutNode, cutContentType, cutTitleType} from './const';

export function getSerializerTokens({
    directiveSyntax,
}: {
    directiveSyntax?: WysiwygEditor.Context['directiveSyntax'];
}): Record<CutNode, SerializerNodeToken> {
    const isDirectiveCut = (node: Node): boolean | undefined => {
        return directiveSyntax?.shouldSerializeToDirective('yfmCut', node.attrs[CutAttr.Markup]);
    };

    return {
        [CutNode.Cut]: (state, cutNode) => {
            const {schema} = cutNode.type;
            const titleNode =
                cutNode.firstChild?.type === cutTitleType(schema) ? cutNode.firstChild : null;
            const contentNode =
                cutNode.lastChild?.type === cutContentType(schema) ? cutNode.lastChild : null;

            if (isDirectiveCut(cutNode)) {
                state.write(':::cut [');
                if (titleNode) state.renderInline(titleNode);
                state.write(']');
                state.ensureNewLine();

                if (contentNode) state.renderContent(contentNode);
                state.ensureNewLine();
                state.write(':::');

                state.closeBlock();
                return;
            }

            state.write('{% cut "');
            if (titleNode) {
                if (titleNode.nodeSize > 2) state.renderInline(titleNode);
                else state.write(getPlaceholderContent(titleNode));
            }
            state.write('" %}\n');
            state.write('\n');

            if (contentNode) state.renderContent(contentNode);
            state.write('{% endcut %}');
            state.closeBlock(cutNode);
        },

        [CutNode.CutTitle]: (state, node, parent) => {
            if (isDirectiveCut(parent)) {
                state.renderInline(node);
                state.ensureNewLine();
                state.closeBlock();
                return;
            }

            if (node.nodeSize > 2) state.renderInline(node);
            else state.write(getPlaceholderContent(node));
            state.ensureNewLine();
            state.closeBlock();
        },

        [CutNode.CutContent]: (state, node, parent) => {
            if (isDirectiveCut(parent)) {
                state.renderContent(node);
                return;
            }

            if (isNodeEmpty(node)) {
                state.write(getPlaceholderContent(node));
                state.write('\n');
                state.write('\n');
            } else {
                state.renderContent(node);
            }
        },
    };
}
