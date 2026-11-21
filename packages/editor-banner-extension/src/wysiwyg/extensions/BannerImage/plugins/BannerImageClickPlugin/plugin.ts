import {Plugin, Selection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {bannerImage} from '@gravity-ui/markdown-plugin-banner';

import {selectedBannerImage} from '../../commands';

export const bannerImageClickPlugin = (show: (view: EditorView, pos: number) => void) =>
    new Plugin({
        props: {
            handleDOMEvents: {
                mousedown(view, event) {
                    const selected = selectedBannerImage(view.state);
                    if (!selected) return false;
                    const focused = view.hasFocus();
                    const image = view.nodeDOM(selected.pos);
                    const onImage =
                        event.button === 0 &&
                        event.target instanceof Node &&
                        image?.contains(event.target);
                    if (onImage && (!focused || bannerImage(selected.node.attrs).src === null)) {
                        event.preventDefault();
                        show(view, selected.pos);
                        return true;
                    }
                    if (focused) return false;
                    const {$from, $to} = view.state.selection;
                    const text =
                        Selection.findFrom($from, -1, true) ?? Selection.findFrom($to, 1, true);
                    if (text) view.dispatch(view.state.tr.setSelection(text));
                    return false;
                },
            },
        },
    });
