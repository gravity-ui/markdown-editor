import {NodeSelection, Plugin, Selection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {headerImage} from '@gravity-ui/markdown-plugin-header';

import {headerImageNodeType} from '../../HeaderImageSpecs';

export const headerImageClickPlugin = (show: (view: EditorView, pos: number) => void) =>
    new Plugin({
        props: {
            handleDOMEvents: {
                mousedown(view, event) {
                    const {selection, schema} = view.state;
                    if (
                        !(selection instanceof NodeSelection) ||
                        selection.node.type !== headerImageNodeType(schema)
                    )
                        return false;
                    const focused = view.hasFocus();
                    const image = view.nodeDOM(selection.from);
                    const onImage =
                        event.button === 0 &&
                        event.target instanceof Node &&
                        image?.contains(event.target);
                    if (onImage && (!focused || headerImage(selection.node.attrs).src === null)) {
                        event.preventDefault();
                        show(view, selection.from);
                        return true;
                    }
                    if (focused) return false;
                    const text =
                        Selection.findFrom(selection.$from, -1, true) ??
                        Selection.findFrom(selection.$to, 1, true);
                    if (text) view.dispatch(view.state.tr.setSelection(text));
                    return false;
                },
            },
        },
    });
