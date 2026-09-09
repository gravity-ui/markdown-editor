import {useLayoutEffect} from 'react';

import {useFloatingRootContext} from '@floating-ui/react';
import {Popup, type PopupProps} from '@gravity-ui/uikit';

type EditorPopupProps = Pick<PopupProps, 'children' | 'placement' | 'onOpenChange'> & {
    editorElement: HTMLElement;
    anchorElement: HTMLElement | null;
};

export function EditorPopup({
    editorElement,
    anchorElement,
    onOpenChange,
    ...props
}: EditorPopupProps) {
    const context = useFloatingRootContext({
        open: true,
        onOpenChange,
        elements: {reference: editorElement, floating: null},
    });

    useLayoutEffect(() => {
        // Keep focus on the editor root: Floating UI inserts its focus fallback next to
        // the DOM reference, and ProseMirror owns all DOM inside the editor.
        context.refs.setPositionReference(anchorElement);
    }, [anchorElement, context.refs]);

    return <Popup {...props} open hasArrow={false} floatingContext={context} />;
}
