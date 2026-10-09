import {useMemo} from 'react';

import {LayoutCells} from '@gravity-ui/icons';
import {
    MarkdownEditorView,
    type ToolbarsPreset,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ToolbarName} from '@gravity-ui/markdown-editor/_/modules/toolbars/constants.js';
import {defaultPreset} from '@gravity-ui/markdown-editor/_/modules/toolbars/presets.js';
import {YfmHtmlConstructor} from '@gravity-ui/markdown-editor/extensions/additional/YfmHtmlConstructor/index.js';
import {parseTemplates} from '@gravity-ui/markdown-editor/extensions/additional/YfmHtmlConstructor/templates/index.js';
import {ThemeProvider} from '@gravity-ui/uikit';

const templates = `
<template type="block" id="test-card" title="Test card">
    <style>
        & { padding: 24px; border: 1px solid #ccd2db; border-radius: 12px; }
        h2 { margin: 0 0 12px; }
    </style>
    <h2 class="card-heading">Alpha beta</h2>
    <p>Supporting content</p>
</template>
<template type="theme" id="test-blue" title="Blue variant" block="test-card">
    <style>& { background: #eef4ff; }</style>
</template>
`;

const toolbarsPreset: ToolbarsPreset = {
    items: {
        ...defaultPreset.items,
        htmlConstructor: {
            view: {title: 'Insert constructor', icon: {data: LayoutCells}},
            wysiwyg: {
                exec: (editor) => editor.actions.createYfmHtmlConstructor.run(),
                isActive: (editor) => editor.actions.createYfmHtmlConstructor.isActive(),
                isEnable: (editor) => editor.actions.createYfmHtmlConstructor.isEnable(),
            },
        },
    },
    orders: {...defaultPreset.orders, [ToolbarName.wysiwygMain]: [['htmlConstructor']]},
};

export const HtmlConstructorFixture = ({theme = 'light'}: {theme?: 'light' | 'dark'}) => {
    const items = useMemo(() => parseTemplates(templates), []);
    const editor = useMarkdownEditor(
        {
            initial: {mode: 'wysiwyg', markup: ''},
            wysiwygConfig: {
                extensions: (builder) =>
                    builder.use(YfmHtmlConstructor, {
                        scopeStyles: true,
                        templates: {items, showButton: true, allowAdd: true},
                    }),
            },
        },
        [],
    );

    return (
        <ThemeProvider theme={theme}>
            <div style={{width: 'min(760px, calc(100vw - 40px))'}}>
                <MarkdownEditorView
                    editor={editor}
                    stickyToolbar={false}
                    toolbarsPreset={toolbarsPreset}
                />
            </div>
        </ThemeProvider>
    );
};
