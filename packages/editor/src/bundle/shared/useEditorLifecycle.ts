import {useLayoutEffect} from 'react';

import {globalLogger} from 'src/logger';

import type {ToolbarActionData} from '../events';

import type {EditorHost} from './editor-host';

/** @internal */
export function useEditorLifecycle(owner: EditorHost) {
    useLayoutEffect(() => {
        const onToolbarAction = ({editorMode, id}: ToolbarActionData) => {
            globalLogger.action({mode: editorMode, source: 'toolbar', action: id});
            owner.logger.action({mode: editorMode, source: 'toolbar', action: id});
        };
        owner.on('toolbar-action', onToolbarAction);
        return () => {
            owner.off('toolbar-action', onToolbarAction);
            owner.destroy();
        };
    }, [owner]);
}
