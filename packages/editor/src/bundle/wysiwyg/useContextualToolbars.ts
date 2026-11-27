import {useEffect, useLayoutEffect, useMemo} from 'react';

import {getContextualToolbarsConfig} from 'src/bundle/toolbar/utils/createToolbarConfig';
import type {WysiwygEditorHost} from 'src/bundle/wysiwyg/editor-host';
import {contextualToolbarsKey} from 'src/extensions/behavior/ContextualToolbars';
import type {ToolbarsPreset} from 'src/modules/toolbars/types';

/** @internal */
export function useContextualToolbars(
    editor: WysiwygEditorHost,
    enabled: boolean,
    toolbarsPreset?: ToolbarsPreset,
) {
    const contextualConfig = useMemo(
        () => getContextualToolbarsConfig(toolbarsPreset),
        [toolbarsPreset],
    );

    useLayoutEffect(() => {
        if (!enabled || editor.mobile) return undefined;
        const {view} = editor.wysiwygEditor;
        return () => {
            if (!view.isDestroyed) view.dispatch(view.state.tr.setMeta(contextualToolbarsKey, {}));
        };
    }, [editor, enabled]);

    useEffect(() => {
        if (!enabled || editor.mobile) return;
        const {view} = editor.wysiwygEditor;
        const current = contextualToolbarsKey.getState(view.state);
        if (
            current?.selection !== contextualConfig.selection ||
            current?.slash !== contextualConfig.slash
        ) {
            view.dispatch(view.state.tr.setMeta(contextualToolbarsKey, contextualConfig));
        }
    }, [editor, enabled, contextualConfig]);
}
