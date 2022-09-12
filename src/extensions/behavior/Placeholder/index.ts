import type {Node, Schema} from 'prosemirror-model';
import {Plugin, PluginKey} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';
import {findChildren, findParentNodeClosestToPos} from 'prosemirror-utils';
import {cn} from '../../../classname';
import type {ExtensionAuto} from '../../../core';
import {isNodeEmpty} from '../../../utils/nodes';
import {isTextSelection} from '../../../utils/selection';

import './index.scss';

export const getPlaceholderContent = (node: Node) => {
    const content = node.type.spec.placeholder?.content || '';

    return typeof content === 'function' ? content(node) : content;
};

const getPlaceholderPluginKeys = (schema: Schema) => {
    const pluginKeys = [];
    for (const node in schema.nodes) {
        if (schema.nodes[node]) {
            const spec = schema.nodes[node].spec;
            if (spec.placeholder?.customPlugin) {
                pluginKeys.push(spec.placeholder.customPlugin);
            }
        }
    }

    return pluginKeys;
};

const b = cn('placeholder');

export const createPlaceholder = (node: Node, focus?: boolean) => {
    const placeholder = document.createElement('div');
    placeholder.classList.add(...b({focus}).split(' '));
    placeholder.textContent = getPlaceholderContent(node);

    return placeholder;
};

const placeholderNeeded = (node: Node) => {
    const childrenWithPlaceholderVisible = findChildren(node, (n) =>
        Boolean(n.type.spec.placeholder?.alwaysVisible),
    );

    return (
        isNodeEmpty(node) &&
        // Если есть дочерние ноды у которых есть постоянный плейсхолдер - отдаем им приоритет
        !childrenWithPlaceholderVisible.length
    );
};

const addDecoration = (
    decorationsMap: Record<number, Decoration | PluginKey>,
    node: Node,
    pos: number,
    cursorPos?: number | null,
) => {
    const placeholderSpec = node.type.spec.placeholder;
    const decorationPosition = pos + node.childCount + 1;

    // Не добавляем декорацию если на этой позиции уже есть плейсхолдер
    if (!placeholderSpec || decorationsMap[decorationPosition]) return;

    if (placeholderSpec.customPlugin) {
        decorationsMap[decorationPosition] = placeholderSpec.customPlugin;

        return;
    }

    decorationsMap[decorationPosition] = Decoration.widget(
        decorationPosition,
        createPlaceholder(node, decorationPosition === cursorPos),
    );
};

export const Placeholder: ExtensionAuto = (builder) => {
    builder.addPlugin(
        () =>
            new Plugin({
                props: {
                    decorations: (state) => {
                        const decorationsMap: Record<number, Decoration | PluginKey> = {};
                        const {selection} = state;
                        const cursorPos = isTextSelection(selection)
                            ? selection.$cursor?.pos
                            : null;

                        getPlaceholderPluginKeys(state.schema).forEach((f) => {
                            // Используем find потому что при помощи него можно проитерировать по DecorationSet.
                            f.getState(state)?.find(undefined, undefined, (spec) => {
                                decorationsMap[spec.pos] = f;

                                return false;
                            });
                        });

                        // Рисуем плэйсхолдеры для всех нод у которых плэйсхолдер alwaysVisible
                        const decorate = (node: Node, pos: number) => {
                            const placeholderSpec = node.type.spec.placeholder;

                            if (
                                placeholderSpec &&
                                placeholderSpec.alwaysVisible &&
                                placeholderNeeded(node)
                            ) {
                                addDecoration(decorationsMap, node, pos, cursorPos);
                            }
                        };

                        state.doc.descendants(decorate);

                        const parentNode = findParentNodeClosestToPos(
                            state.selection.$from,
                            (node) => {
                                return Boolean(node.type.spec.placeholder);
                            },
                        );

                        const placeholderSpec = parentNode?.node.type.spec.placeholder;

                        // Дорисовываем плэйсхолдер, если его нужно отрисовать на месте курсора
                        if (
                            parentNode &&
                            placeholderNeeded(parentNode.node) &&
                            placeholderSpec &&
                            !placeholderSpec.alwaysVisible
                        ) {
                            addDecoration(
                                decorationsMap,
                                parentNode.node,
                                parentNode.pos,
                                cursorPos,
                            );
                        }

                        const decorations = Object.values(decorationsMap).filter(
                            (decoration) => !(decoration instanceof PluginKey),
                        ) as Decoration[];

                        return DecorationSet.create(state.doc, decorations);
                    },
                },
            }),
    );
};

declare module 'prosemirror-model' {
    interface NodeSpec {
        placeholder?: {
            content: string | ((node: Node) => string);
            customPlugin?: PluginKey<DecorationSet>;
            alwaysVisible?: boolean;
        };
    }
}
