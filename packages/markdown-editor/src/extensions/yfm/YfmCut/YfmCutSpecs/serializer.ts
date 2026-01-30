import type {Node} from 'prosemirror-model';

import type {SerializerNodeToken} from '../../../../core';
import {isNodeEmpty} from '../../../../utils/nodes';
import {getPlaceholderContent} from '../../../../utils/placeholder';

import {CutAttr, CutNode} from './const';

export function getSerializerTokens({
    directiveSyntax,
}: {
    directiveSyntax?: WysiwygEditor.Context['directiveSyntax'];
}): Record<CutNode, SerializerNodeToken> {
    const isDirectiveCut = (node: Node): boolean | undefined => {
        return directiveSyntax?.shouldSerializeToDirective('yfmCut', node.attrs[CutAttr.Markup]);
    };

    return {
        [CutNode.Cut]: (state, node) => {
            state.renderContent(node);
            state.write(isDirectiveCut(node) ? ':::' : '{% endcut %}');
            state.closeBlock(node);
        },

        [CutNode.CutTitle]: (state, node, parent) => {
            if (isDirectiveCut(parent)) {
                state.write(':::cut [');
                state.renderInline(node);
                state.write(']');
                state.ensureNewLine();
                state.closeBlock();
                return;
            }

            state.write('{% cut "');
            if (node.nodeSize > 2) state.renderInline(node);
            else state.write(getPlaceholderContent(node));
            state.write('" %}\n');
            state.write('\n');
            state.closeBlock();
        },

        [CutNode.CutContent]: (state, node, parent) => {
            if (isDirectiveCut(parent)) {
                state.renderContent(node);
                return;
            }

            if (!isNodeEmpty(node)) state.renderInline(node);
            else state.write(getPlaceholderContent(node) + '\n\n');
        },
    };
}
