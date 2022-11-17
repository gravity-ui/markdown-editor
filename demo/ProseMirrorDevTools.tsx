import React from 'react';
import ReactDOM from 'react-dom';
import type {EditorView} from 'prosemirror-view';
import applyDevTools from 'prosemirror-dev-tools';

const DEVTOOLS_CLASS_NAME = '__prosemirror-dev-tools__';

export type ProseMirrorDevToolsProps = {
    view: EditorView;
};

export function ProseMirrorDevTools({view}: ProseMirrorDevToolsProps) {
    React.useEffect(() => {
        applyDevTools(view);
    }, [view]);
    React.useLayoutEffect(() => {
        return () => {
            const devToolsRoot = document.querySelector(`.${DEVTOOLS_CLASS_NAME}`);
            if (devToolsRoot) ReactDOM.unmountComponentAtNode(devToolsRoot);
        };
    }, [view]);

    return null;
}
