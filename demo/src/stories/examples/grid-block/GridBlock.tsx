import {memo} from 'react';

import {LayoutCells} from '@gravity-ui/icons';
import {
    MarkdownEditorView,
    type ToolbarsPreset,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ToolbarName as Toolbar} from '@gravity-ui/markdown-editor/_/modules/toolbars/constants.js';
import {defaultPreset} from '@gravity-ui/markdown-editor/_/modules/toolbars/presets.js';
import {GridBlock as GridBlockExtension} from '@gravity-ui/markdown-editor/extensions/additional/GridBlock/index.js';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

const gridBlockItemId = 'gridBlock';

const toolbarsPreset: ToolbarsPreset = {
    items: {
        ...defaultPreset.items,
        [gridBlockItemId]: {
            view: {
                icon: {data: LayoutCells},
                title: 'Grid block',
            },
            wysiwyg: {
                exec: (e) => e.actions.createGridBlock.run(),
                isActive: (e) => e.actions.createGridBlock.isActive(),
                isEnable: (e) => e.actions.createGridBlock.isEnable(),
            },
        },
    },
    orders: {
        ...defaultPreset.orders,
        [Toolbar.wysiwygMain]: [[gridBlockItemId], ...defaultPreset.orders[Toolbar.wysiwygMain]],
    },
};

export const GridBlockDemo = memo(function GridBlockDemo() {
    const editor = useMarkdownEditor(
        {
            initial: {mode: 'wysiwyg', markup: ''},
            wysiwygConfig: {extensions: GridBlockExtension},
        },
        [],
    );

    return (
        <PlaygroundLayout
            editor={editor}
            view={({className}) => (
                <MarkdownEditorView
                    autofocus
                    stickyToolbar
                    settingsVisible
                    editor={editor}
                    className={className}
                    toolbarsPreset={toolbarsPreset}
                />
            )}
        />
    );
});
