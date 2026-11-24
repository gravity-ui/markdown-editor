import {useCallback} from 'react';

import {
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ToolbarName, commonmark} from '@gravity-ui/markdown-editor/toolbars';
import {Section, toolbarSectionItem} from '@gravity-ui/markdown-editor-section-extension';
import {sectionPlugin} from '@gravity-ui/markdown-plugin-section';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';

import './Section.scss';

const toolbars = {
    items: {...commonmark.items, section: toolbarSectionItem},
    orders: {
        ...commonmark.orders,
        [ToolbarName.wysiwygMain]: [...commonmark.orders[ToolbarName.wysiwygMain], ['section']],
        [ToolbarName.wysiwygHidden]: [],
        [ToolbarName.markupHidden]: [],
    },
};

const previewPlugins = [sectionPlugin];

const initialMarkup = `::::section{padding="false" gap="5"}

:::column{size="4" background="blue"}

First column

:::

:::column{size="4" background="green"}

Second column

:::

:::column{size="4" background="yellow"}

Third column

:::

::::`;

export function SectionExample() {
    const renderPreview = useCallback<RenderPreview>(
        ({getValue}) => (
            <SplitModePreviewLazy
                getValue={getValue}
                extraPlugins={previewPlugins}
                needToSanitizeHtml
            />
        ),
        [],
    );
    const editor = useMarkdownEditor({
        initial: {markup: initialMarkup, mode: 'wysiwyg', toolbarVisible: true},
        wysiwygConfig: {extensions: (builder) => builder.use(Section)},
        markupConfig: {renderPreview},
    });
    return (
        <PlaygroundLayout
            editor={editor}
            view={({className}) => (
                <MarkdownEditorView
                    qa="demo-md-editor"
                    className={['demo-section-editor', className].filter(Boolean).join(' ')}
                    editor={editor}
                    toolbarsPreset={toolbars}
                    stickyToolbar={false}
                />
            )}
        />
    );
}
