import {memo} from 'react';

import {
    MarkdownEditorView,
    type RenderPreviewParams,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {
    Header,
    headerItemView,
    headerItemWysiwyg,
} from '@gravity-ui/markdown-editor/extensions/additional/Header/index.js';
import {ToolbarName, full} from '@gravity-ui/markdown-editor/toolbars';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {SplitModePreview} from '../../../components/SplitModePreview';

import {markup} from './markup';

export type HeaderDemoProps = {
    markupKey: keyof typeof markup;
};

const renderPreview = (props: RenderPreviewParams) => (
    <SplitModePreview {...props} needToSanitizeHtml />
);

const fileUploadHandler = async (file: File) => ({url: URL.createObjectURL(file), name: file.name});

const toolbarsPreset = {
    items: {...full.items, header: {view: headerItemView, wysiwyg: headerItemWysiwyg}},
    orders: {
        ...full.orders,
        [ToolbarName.wysiwygMain]: [...full.orders[ToolbarName.wysiwygMain], ['header']],
    },
};

export const HeaderDemo = memo<HeaderDemoProps>(function HeaderDemo({markupKey}) {
    const editor = useMarkdownEditor(
        {
            initial: {mode: 'wysiwyg', markup: markup[markupKey]},
            markupConfig: {renderPreview},
            wysiwygConfig: {
                extensions: (builder) => builder.use(Header, {fileUploadHandler}),
            },
        },
        [markupKey],
    );

    return (
        <PlaygroundLayout
            editor={editor}
            view={({className}) => (
                <MarkdownEditorView
                    autofocus
                    stickyToolbar
                    settingsVisible
                    toolbarsPreset={toolbarsPreset}
                    editor={editor}
                    className={className}
                />
            )}
        />
    );
});
