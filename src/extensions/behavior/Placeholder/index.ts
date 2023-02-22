import type {Node, Schema} from 'prosemirror-model';
import {EditorState, Plugin, PluginKey} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';
import {findChildren, findParentNodeClosestToPos} from 'prosemirror-utils';
import {cn} from '../../../classname';
import type {ExtensionAuto} from '../../../core';
import {isNodeEmpty} from '../../../utils/nodes';
import {isTextSelection} from '../../../utils/selection';
import {getPlaceholderContent} from '../../../utils/placeholder';

import './index.scss';

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

export const createPlaceholder = (node: Node, parent: Node | null, focus?: boolean) => {
    const content = getPlaceholderContent(node, parent);
    if (!content) return null;

    const placeholder = document.createElement('div');
    placeholder.classList.add(...b({focus}).split(' '));
    placeholder.textContent = content;
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
    widgetsMap: WidgetsMap,
    node: Node,
    pos: number,
    parent: Node | null,
    cursorPos: number | null | undefined,
    globalState: ApplyGlobalState,
) => {
    const placeholderSpec = node.type.spec.placeholder;
    const decorationPosition = pos + node.childCount + 1;

    // Не добавляем декорацию если на этой позиции уже есть плейсхолдер
    if (!placeholderSpec || widgetsMap[decorationPosition]) return;

    if (placeholderSpec.customPlugin) {
        widgetsMap[decorationPosition] = placeholderSpec.customPlugin;
        return;
    }

    const focus = decorationPosition === cursorPos;

    const placeholderDOM = createPlaceholder(node, parent, focus);
    if (!placeholderDOM) return;

    if (focus) globalState.hasFocus = true;

    widgetsMap[decorationPosition] = {
        pos: decorationPosition,
        toDOM: placeholderDOM,
    };
};

type ApplyGlobalState = {hasFocus: boolean};

type DecoWidgetParameters = Parameters<typeof Decoration.widget>;
type WidgetSpec = {
    pos: DecoWidgetParameters[0];
    toDOM: DecoWidgetParameters[1];
    spec?: DecoWidgetParameters[2];
};

type PlaceholderPluginState = {
    widgets: WidgetSpec[];
    hasFocus: boolean;
};

type WidgetsMap = Record<number, WidgetSpec | PluginKey>;

const pluginKey = new PluginKey<PlaceholderPluginState>('placeholder_plugin');

export const Placeholder: ExtensionAuto = (builder) => {
    builder.addPlugin(
        () =>
            new Plugin<PlaceholderPluginState>({
                key: pluginKey,
                props: {
                    attributes(state) {
                        const attrs: Record<string, string> = {};
                        if (pluginKey.getState(state)!.hasFocus) {
                            // hide native cursor
                            attrs.class = 'yfm-editor-hidecursor';
                        }
                        return attrs;
                    },
                    decorations(state) {
                        const {widgets} = pluginKey.getState(state)!;
                        return DecorationSet.create(
                            state.doc,
                            widgets.map((widget) =>
                                Decoration.widget(widget.pos, widget.toDOM, widget.spec),
                            ),
                        );
                    },
                },
                state: {
                    init: (_config, state) => applyState(state),
                    apply: (_tr, _value, _oldState, state) => applyState(state),
                },
            }),
    );
};

function applyState(state: EditorState): PlaceholderPluginState {
    const globalState: ApplyGlobalState = {hasFocus: false};
    const widgetsMap: WidgetsMap = {};
    const {selection} = state;
    const cursorPos = isTextSelection(selection) ? selection.$cursor?.pos : null;

    getPlaceholderPluginKeys(state.schema).forEach((f) => {
        // Используем find потому что при помощи него можно проитерировать по DecorationSet.
        f.getState(state)?.find(undefined, undefined, (spec) => {
            widgetsMap[spec.pos] = f;
            return false;
        });
    });

    // Рисуем плэйсхолдеры для всех нод у которых плэйсхолдер alwaysVisible
    const decorate = (node: Node, pos: number, parent: Node | null) => {
        const placeholderSpec = node.type.spec.placeholder;

        if (placeholderSpec && placeholderSpec.alwaysVisible && placeholderNeeded(node)) {
            addDecoration(widgetsMap, node, pos, parent, cursorPos, globalState);
        }
    };

    state.doc.descendants(decorate);

    const parentNode = findParentNodeClosestToPos(state.selection.$from, (node) => {
        return Boolean(node.type.spec.placeholder);
    });

    const placeholderSpec = parentNode?.node.type.spec.placeholder;

    // Дорисовываем плэйсхолдер, если его нужно отрисовать на месте курсора
    if (
        parentNode &&
        placeholderNeeded(parentNode.node) &&
        placeholderSpec &&
        !placeholderSpec.alwaysVisible
    ) {
        const {node, pos, depth} = parentNode;
        const parent = depth > 0 ? state.selection.$from.node(depth - 1) : null;
        addDecoration(widgetsMap, node, pos, parent, cursorPos, globalState);
    }

    const widgets = Object.values(widgetsMap).filter(
        (decoration) => !(decoration instanceof PluginKey),
    ) as WidgetSpec[];

    return {widgets, hasFocus: globalState.hasFocus};
}

declare module 'prosemirror-model' {
    interface NodeSpec {
        placeholder?: {
            content: string | ((node: Node, parent?: Node | null) => string | null);
            customPlugin?: PluginKey<DecorationSet>;
            alwaysVisible?: boolean;
        };
    }
}
