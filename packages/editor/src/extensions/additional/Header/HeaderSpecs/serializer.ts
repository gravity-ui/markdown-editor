import type {SerializerNodeToken} from '#core';
import type {Node} from '#pm/model';

import {serializeHeaderAttrs} from './attrs';
import {HeaderNode, type HeaderNodeName, headerDirectiveName} from './const';
import {type HeaderActionData, makeHeaderAction, serializeHeaderContent} from './content';

function collectActions(actions: Node): HeaderActionData[] {
    const result: HeaderActionData[] = [];
    actions.forEach((action) => result.push(makeHeaderAction(action.attrs, action.textContent)));
    return result;
}

/**
 * Директива собирается целиком в токене корня: тело — это один yaml-документ, и разложить его
 * по сериализаторам детей нельзя, не заставив каждого ребёнка знать про соседей. Дети остаются
 * в реестре, но вызываются только при отдельном рендере поддерева.
 */
export const serializerTokens: Record<HeaderNodeName, SerializerNodeToken> = {
    [HeaderNode.Header]: (state, node) => {
        const [title, description, actions] = [node.child(0), node.child(1), node.child(2)];

        const body = serializeHeaderContent({
            title: title.textContent,
            description: description.textContent,
            actions: collectActions(actions),
        });

        state.write(`:::${headerDirectiveName}${serializeHeaderAttrs(node.attrs)}`);
        state.ensureNewLine();
        // `text`, а не `write`: тело многострочное, и только `text` раскладывает его по строкам
        // с отбивкой блока — иначе внутри цитаты у строк yaml пропадёт `> `.
        if (body) {
            state.text(body.trimEnd(), false);
            state.ensureNewLine();
        }
        state.write(':::');
        state.closeBlock(node);
    },

    [HeaderNode.Title]: (state, node) => {
        state.text(node.textContent, false);
        state.closeBlock(node);
    },
    [HeaderNode.Description]: (state, node) => {
        state.text(node.textContent, false);
        state.closeBlock(node);
    },
    [HeaderNode.Actions]: (state, node) => {
        state.renderContent(node);
    },
    [HeaderNode.Action]: (state, node) => {
        state.text(node.textContent, false);
        state.closeBlock(node);
    },
};
