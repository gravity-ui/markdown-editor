import {memo} from 'react';

import {LayoutCells} from '@gravity-ui/icons';
import {
    MarkdownEditorView,
    type ToolbarsPreset,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ToolbarName as Toolbar} from '@gravity-ui/markdown-editor/_/modules/toolbars/constants.js';
import {defaultPreset} from '@gravity-ui/markdown-editor/_/modules/toolbars/presets.js';
import {YfmHtmlConstructor as YfmHtmlConstructorExtension} from '@gravity-ui/markdown-editor/extensions/additional/YfmHtmlConstructor/index.js';

import {yfmHtmlConstructorTemplates} from '../../../defaults/yfm-html-constructor';
import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

const yfmHtmlConstructorItemId = 'yfmHtmlConstructor';

const toolbarsPreset: ToolbarsPreset = {
    items: {
        ...defaultPreset.items,
        [yfmHtmlConstructorItemId]: {
            view: {
                icon: {data: LayoutCells},
                title: 'YFM HTML Constructor',
            },
            wysiwyg: {
                exec: (e) => e.actions.createYfmHtmlConstructor.run(),
                isActive: (e) => e.actions.createYfmHtmlConstructor.isActive(),
                isEnable: (e) => e.actions.createYfmHtmlConstructor.isEnable(),
            },
        },
    },
    orders: {
        ...defaultPreset.orders,
        [Toolbar.wysiwygMain]: [
            [yfmHtmlConstructorItemId],
            ...defaultPreset.orders[Toolbar.wysiwygMain],
        ],
    },
};

export const YfmHtmlConstructorDemo = memo(function YfmHtmlConstructorDemo() {
    const editor = useMarkdownEditor(
        {
            initial: {mode: 'wysiwyg', markup: ''},
            wysiwygConfig: {
                extensions: (builder) =>
                    builder.use(YfmHtmlConstructorExtension, {
                        templates: {
                            items: yfmHtmlConstructorTemplates,
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
