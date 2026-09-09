import {useLayoutEffect} from 'react';

import {useFloatingRootContext} from '@floating-ui/react';
import {Popup, type PopupProps} from '@gravity-ui/uikit';

import {NodeSelection, TextSelection} from '#pm/state';
import type {EditorView} from '#pm/view';

type EditorPopupProps = Pick<PopupProps, 'children' | 'placement' | 'onOpenChange'> & {
    editorView: EditorView;
    anchorElement: HTMLElement | null;
};

export function EditorPopup({editorView, anchorElement, onOpenChange, ...props}: EditorPopupProps) {
    const context = useFloatingRootContext({
        open: true,
        onOpenChange,
        elements: {reference: editorView.dom, floating: null},
    });

    useLayoutEffect(() => {
        // Keep focus on the editor root: Floating UI inserts its focus fallback next to
        // the DOM reference, and ProseMirror owns all DOM inside the editor.
        context.refs.setPositionReference(anchorElement);

        const {state} = editorView;
        const {selection} = state;
        if (
            editorView.hasFocus() &&
            selection instanceof NodeSelection &&
            !selection.node.isAtom &&
            editorView.nodeDOM(selection.from) === anchorElement
        ) {
            // Opening a block toolbar has historically selected the block's text.
            // Preserve that behavior explicitly without relying on popup DOM mutations.
            editorView.dispatch(
                state.tr.setSelection(
                    TextSelection.between(
                        state.doc.resolve(selection.from + 1),
                        state.doc.resolve(selection.to - 1),
                    ),
                ),
            );
        }
    }, [anchorElement, context.refs, editorView]);

    return <Popup {...props} open hasArrow={false} floatingContext={context} />;
}
