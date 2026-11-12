import {useCallback} from 'react';

import {
    type MarkdownEditorMode,
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {Button} from '@gravity-ui/markdown-editor-header-extension';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';
import {block} from '../../utils/cn';

import './Button.scss';

const b = block('button-example');

export function ButtonExample({
    initial = ':::button{href="https://example.com"}\nКнопка\n:::',
    palette = false,
    mode = 'wysiwyg',
    width = 660,
}: {
    initial?: string;
    palette?: boolean;
    mode?: MarkdownEditorMode;
    width?: number;
}) {
    const renderPreview = useCallback<RenderPreview>(
        ({getValue}) => <SplitModePreviewLazy getValue={getValue} needToSanitizeHtml />,
        [],
    );
    const editor = useMarkdownEditor({
        initial: {markup: initial, mode, toolbarVisible: true},
        wysiwygConfig: {extensions: (builder) => builder.use(Button)},
        markupConfig: {renderPreview},
    });

    return (
        <div className={b({palette})}>
            <PlaygroundLayout
                editor={editor}
                viewWidth={width}
                view={({className}) => (
                    <MarkdownEditorView
                        qa="demo-md-editor"
                        className={className}
                        editor={editor}
                        stickyToolbar={false}
                    />
                )}
            />
        </div>
    );
}
