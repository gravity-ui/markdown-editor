import {Plugin, TextSelection} from 'prosemirror-state';

/** Keep the caret outside noneditable placeholder widgets when an empty slot is clicked. */
export const headerEditingPlugin = () =>
    new Plugin({
        props: {
            handleClick(view, _pos, event) {
                const target = event.target instanceof Element ? event.target : null;
                const textblock = target?.closest(
                    '.g-md-header__title, .g-md-header .header_content :is(p, h1, h2, h3, h4, h5, h6)',
                );
                if (!textblock || !view.dom.contains(textblock)) return false;
                const pos = view.posAtDOM(textblock, 0);
                const $pos = view.state.doc.resolve(pos);
                if (!$pos.parent.isTextblock || $pos.parent.content.size) return false;
                view.dispatch(
                    view.state.tr.setSelection(TextSelection.create(view.state.doc, pos)),
                );
                view.focus();
                return true;
            },
        },
    });
