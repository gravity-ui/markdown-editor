import {useCallback} from 'react';

import {
    type MarkdownEditorMode,
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ActionName, ToolbarName, commonmark} from '@gravity-ui/markdown-editor/toolbars';
import {Term, toolbarTermItem} from '@gravity-ui/markdown-editor-yfm-term-extension';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';

const termAction = 'insertTerm';
const toolbars = {
    items: {...commonmark.items, [termAction]: toolbarTermItem},
    orders: {
        ...commonmark.orders,
        [ToolbarName.wysiwygMain]: [
            [ActionName.undo, ActionName.redo],
            [ActionName.bold, ActionName.italic, ActionName.link],
            [termAction],
        ],
        [ToolbarName.wysiwygSelection]: [
            ...commonmark.orders[ToolbarName.wysiwygSelection],
            [termAction],
        ],
        [ToolbarName.wysiwygSlash]: [...commonmark.orders[ToolbarName.wysiwygSlash], [termAction]],
        [ToolbarName.wysiwygHidden]: [],
        [ToolbarName.markupHidden]: [],
    },
};

const example = [
    'An [API](*api) lets software systems communicate. An [application programming interface](*api) can be public or private.',
    '[*api]: A contract describing how software components can interact.',
].join('\n\n');

export function TermExample({
    initial = example,
    mode = 'wysiwyg',
    width,
}: {
    initial?: string;
    mode?: MarkdownEditorMode;
    width?: number;
}) {
    const renderPreview = useCallback<RenderPreview>(
        ({getValue}) => <SplitModePreviewLazy getValue={getValue} needToSanitizeHtml />,
        [],
    );
    const editor = useMarkdownEditor({
        initial: {markup: initial, mode, toolbarVisible: true},
        wysiwygConfig: {extensions: (builder) => builder.use(Term)},
        markupConfig: {renderPreview},
    });
    return (
        <PlaygroundLayout
            editor={editor}
            viewWidth={width}
            view={({className}) => (
                <MarkdownEditorView
                    qa="demo-md-editor"
                    className={className}
                    editor={editor}
                    toolbarsPreset={toolbars}
                    stickyToolbar={false}
                />
            )}
        />
    );
}
