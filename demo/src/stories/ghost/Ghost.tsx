import {
    MarkdownEditorView,
    type ToolbarsPreset,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ToolbarName as Toolbar, full} from '@gravity-ui/markdown-editor/toolbars';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {useLogs} from '../../hooks/useLogs';

import {initialMdContent} from './content';
import {ghostPopupExtension, ghostPopupItemMarkup, ghostPopupItemView} from './ghostExtension';

const ghost = 'ghost';

const toolbarsPreset: ToolbarsPreset = {
    items: {
        ...full.items,
        [ghost]: {view: ghostPopupItemView, markup: ghostPopupItemMarkup},
    },
    orders: {
        ...full.orders,
        [Toolbar.markupMain]: [[ghost], ...full.orders[Toolbar.markupMain]],
    },
};

export const Ghost = () => {
    const editor = useMarkdownEditor({
        initial: {markup: initialMdContent, mode: 'markup'},
        markupConfig: {extensions: [ghostPopupExtension]},
    });

    useLogs(editor.logger);

    return (
        <PlaygroundLayout
            editor={editor}
            view={() => (
                <MarkdownEditorView
                    stickyToolbar
                    settingsVisible
                    editor={editor}
                    toolbarsPreset={toolbarsPreset}
                />
            )}
        />
    );
};
