import {RefObject, useEffect} from 'react';

import {EditorView} from 'prosemirror-view';

import {useBooleanState} from './hooks';

export const useNodeEditing = ({
    nodeRef,
    view,
}: {
    nodeRef: RefObject<HTMLElement>;
    view: EditorView;
}) => {
    const state = useBooleanState(false);
    const [, , unsetEdit, toggleEdit] = state;

    const anchor = nodeRef.current;
    useEffect(() => {
        anchor?.addEventListener('dblclick', toggleEdit);
        view.dom.addEventListener('focus', unsetEdit);
        return () => {
            anchor?.removeEventListener('dblclick', toggleEdit);
            view.dom.removeEventListener('focus', unsetEdit);
        };
    }, [anchor, view.dom, toggleEdit, unsetEdit]);

    return state;
};
