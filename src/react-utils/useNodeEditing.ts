import {RefObject, useEffect} from 'react';

import {EditorView} from 'prosemirror-view';

import {useBooleanState} from './hooks';

export interface UseNodeEditingArgs {
    nodeRef: RefObject<HTMLElement>;
    view: EditorView;
}

export const useNodeEditing = ({nodeRef, view}: UseNodeEditingArgs) => {
    const state = useBooleanState(false);
    const [, , unsetEdit, toggleEdit] = state;

    useEffect(() => {
        const {current: anchor} = nodeRef;
        anchor?.addEventListener('dblclick', toggleEdit);
        view.dom.addEventListener('focus', unsetEdit);
        return () => {
            anchor?.removeEventListener('dblclick', toggleEdit);
            view.dom.removeEventListener('focus', unsetEdit);
        };
        // https://github.com/facebook/react/issues/23392#issuecomment-1055610198
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view.dom, toggleEdit, unsetEdit, nodeRef.current]);

    return state;
};
