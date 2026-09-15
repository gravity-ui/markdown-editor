import type {SerializerNodeToken} from '#core';
import type {Node} from '#pm/model';
import {isNodeEmpty} from 'src/utils/nodes';

import {serializeHeaderActionAttrs, serializeHeaderAttrs} from './attrs';
import {HeaderNode, type HeaderNodeName, actionDirectiveName, headerDirectiveName} from './const';

/**
 * Вся директива собирается в токене корневого узла: у `:::header` десяток атрибутов, и размазывать
 * их по сериализаторам детей (как это сделано в YfmCut) означает, что каждый ребёнок лезет
 * в `parent.attrs`. Токены детей остаются валидными на случай отдельного рендера поддерева.
 */
export const serializerTokens: Record<HeaderNodeName, SerializerNodeToken> = {
    [HeaderNode.Header]: (state, node) => {
        const [title, subtitle, actions] = [node.child(0), node.child(1), node.child(2)];

        state.write(`:::${headerDirectiveName}`);
        if (!isNodeEmpty(title)) {
            state.write(' [');
            state.renderInline(title, false);
            state.write(']');
        }
        state.write(serializeHeaderAttrs(node.attrs));
        state.ensureNewLine();

        if (!isNodeEmpty(subtitle)) {
            state.renderInline(subtitle);
            state.ensureNewLine();
            // Пустая строка нужна только чтобы отделить подзаголовок от кнопок
            if (actions.childCount) state.write('\n');
        }

        actions.forEach((action) => {
            state.write(`::${actionDirectiveName}[`);
            state.renderInline(action, false);
            state.write(`]${serializeHeaderActionAttrs(action.attrs)}`);
            state.ensureNewLine();
        });

        state.write(':::');
        state.closeBlock(node);
    },

    [HeaderNode.Title]: (state, node) => {
        state.renderInline(node);
        state.closeBlock(node);
    },
    [HeaderNode.Subtitle]: (state, node) => {
        state.renderInline(node);
        state.closeBlock(node);
    },
    [HeaderNode.Actions]: (state, node) => {
        state.renderContent(node);
    },
    [HeaderNode.Action]: (state, node: Node) => {
        state.write(`::${actionDirectiveName}[`);
        state.renderInline(node, false);
        state.write(`]${serializeHeaderActionAttrs(node.attrs)}`);
        state.closeBlock(node);
    },
};
