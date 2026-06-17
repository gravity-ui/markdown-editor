import {memo} from 'react';

import {LayoutCells} from '@gravity-ui/icons';
import {
    MarkdownEditorView,
    type ToolbarsPreset,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ToolbarName as Toolbar} from '@gravity-ui/markdown-editor/_/modules/toolbars/constants.js';
import {defaultPreset} from '@gravity-ui/markdown-editor/_/modules/toolbars/presets.js';
import {GridBlockTemplates as GridBlockTemplatesExtension} from '@gravity-ui/markdown-editor/extensions/additional/GridBlockTemplates/index.js';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {gridBlockTemplates} from '../../../defaults/grid-block-templates';

const gridBlockTemplatesItemId = 'gridBlockTemplates';

const toolbarsPreset: ToolbarsPreset = {
    items: {
        ...defaultPreset.items,
        [gridBlockTemplatesItemId]: {
            view: {
                icon: {data: LayoutCells},
                title: 'Grid block templates',
            },
            wysiwyg: {
                exec: (e) => e.actions.createGridBlockTemplates.run(),
                isActive: (e) => e.actions.createGridBlockTemplates.isActive(),
                isEnable: (e) => e.actions.createGridBlockTemplates.isEnable(),
            },
        },
    },
    orders: {
        ...defaultPreset.orders,
        [Toolbar.wysiwygMain]: [
            [gridBlockTemplatesItemId],
            ...defaultPreset.orders[Toolbar.wysiwygMain],
        ],
    },
};

export const GridBlockTemplatesDemo = memo(function GridBlockTemplatesDemo() {
    const editor = useMarkdownEditor(
        {
            initial: {mode: 'wysiwyg', markup: ''},
            wysiwygConfig: {
                extensions: (builder) =>
                    builder.use(GridBlockTemplatesExtension, {
                        templates: {
                            items: gridBlockTemplates,
                            showButton: true,
                            allowAdd: true,
                        },
                    }),
            },
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
