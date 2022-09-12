import {DOMSerializer} from 'prosemirror-model';
import {Decoration, DecorationSet, EditorView} from 'prosemirror-view';
import {EditorState, NodeSelection, Plugin, PluginKey} from 'prosemirror-state';

import {pType} from '../../base/BaseSchema';
import {createPlaceholder} from '../../behavior/Placeholder';
import {GapCursorSelection} from './GapCursorSelection';

import './gapcursor.scss';

const key = new PluginKey('gapCursorPlugin');

export const gapCursor = () =>
    new Plugin({
        key,
        state: {
            init: () => false,
            apply: (_tr, _pluginState, _oldState, newState) => {
                return (
                    newState.selection instanceof GapCursorSelection ||
                    newState.selection instanceof NodeSelection
                );
            },
        },
        view() {
            return {
                update(view: EditorView) {
                    const pluginState = key.getState(view.state);

                    view.dom.classList.toggle('Prosemirror-hide-cursor', pluginState);
                },
            };
        },
        props: {
            decorations: ({doc, selection}: EditorState) => {
                if (selection instanceof GapCursorSelection) {
                    const position = selection.head;

                    return DecorationSet.create(doc, [
                        Decoration.widget(position, toDOM, {
                            key: 'gapcursor',
                            side: -1,
                        }),
                    ]);
                }

                return null;
            },
        },
    });

// prosemirror-view inner types
type DOMNode = InstanceType<typeof window.Node>;
type WidgetConstructor =
    | ((view: EditorView, getPos: () => number | undefined) => DOMNode)
    | DOMNode;
const toDOM: WidgetConstructor = (view, getPos) => {
    const node = pType(view.state.schema).create();

    const element = DOMSerializer.fromSchema(view.state.schema).serializeNode(node);
    element.appendChild(createPlaceholder(node, true));
    (element as Element).classList.add('ye-gapcursor');
    (element as HTMLElement).addEventListener('mousedown', () => {
        const pos = getPos();
        if (pos !== undefined) {
            view.dispatch(view.state.tr.replaceSelectionWith(node));
        }
    });

    return element;
};
