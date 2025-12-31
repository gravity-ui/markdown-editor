import type {SerializerNodeToken} from '../../../../core';
import {CellAlign, TableAttrs, TableNode} from '../const';

export const serializerTokens: Record<TableNode, SerializerNodeToken> = {
    [TableNode.Table]: (state, node) => {
        state.ensureNewLine();
        state.write('\n');

        state.setNoAutoBlank();
        state.renderContent(node);
        state.unsetNoAutoBlank();

        state.ensureNewLine();

        state.closeBlock(node);
    },

    [TableNode.Head]: (state, node) => {
        state.renderContent(node);

        for (const cellNode of node.content.content[0].content.content) {
            switch (cellNode.attrs[TableAttrs.CellAlign]) {
                case CellAlign.Left:
                    state.write('|:---');
                    break;
                case CellAlign.Center:
                    state.write('|:---:');
                    break;
                case CellAlign.Right:
                    state.write('|---:');
                    break;
                default:
                    state.write('|---');
                    break;
            }
        }

        state.write('|');
        state.ensureNewLine();

        state.closeBlock(node);
    },

    [TableNode.Body]: (state, node) => {
        state.renderContent(node);
        state.closeBlock(node);
    },

    [TableNode.Row]: (state, node) => {
        state.renderContent(node);
        state.closeBlock(node);
        state.write('|');
        state.ensureNewLine();
    },

    [TableNode.HeaderCell]: (state, node) => {
        state.write('|');
        state.renderInline(node);
        state.closeBlock(node);
    },

    [TableNode.DataCell]: (state, node) => {
        state.write('|');

        state.renderInline(node);
        state.closeBlock(node);
    },
};
