import {DOMSerializer} from 'prosemirror-model';
import {type EditorState, Plugin, PluginKey, TextSelection} from 'prosemirror-state';
import {Decoration, DecorationSet, type EditorView} from 'prosemirror-view';

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
            handleKeyPress(view) {
                const {
                    state,
                    state: {selection: sel},
                } = view;
                if (isGapCursorSelection(sel)) {
                    // Replace GapCursorSelection with empty textblock before run all other handlers.
                    // This should be done before all inputRules and other handlers, that handle text input.
                    // Thus, entering text into a native textblock and into a "virtual" one – GapCursor – will be the same.
                    const tr = state.tr.replaceSelectionWith(pType(state.schema).create());
                    tr.setSelection(TextSelection.create(tr.doc, sel.pos + 1));
                    view.dispatch(tr.scrollIntoView());
                }
                return false;
            },
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
