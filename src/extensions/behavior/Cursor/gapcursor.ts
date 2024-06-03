import {DOMSerializer} from 'prosemirror-model';
import {EditorState, Plugin, PluginKey} from 'prosemirror-state';
import {Decoration, DecorationSet, EditorView} from 'prosemirror-view';

import {isNodeSelection} from '../../../utils/selection';
import {pType} from '../../base/BaseSchema';
import {createPlaceholder} from '../../behavior/Placeholder';

import {isGapCursorSelection} from './GapCursorSelection';

import './gapcursor.scss';

const key = new PluginKey('gapCursorPlugin');

export const gapCursor = () =>
    new Plugin({
        key,
        state: {
            init: () => false,
            apply: (_tr, _pluginState, _oldState, newState) => {
                const sel = newState.selection;
                return isGapCursorSelection(sel) || isNodeSelection(sel);
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
                if (isGapCursorSelection(selection)) {
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
    const placeholderDOM = createPlaceholder(node, null, true);
    if (placeholderDOM) element.appendChild(placeholderDOM);
    (element as Element).classList.add('g-md-gapcursor');
    (element as HTMLElement).addEventListener('mousedown', () => {
        const pos = getPos();
        if (pos !== undefined) {
            view.dispatch(view.state.tr.replaceSelectionWith(node));
        }
    });

    return element;
};
