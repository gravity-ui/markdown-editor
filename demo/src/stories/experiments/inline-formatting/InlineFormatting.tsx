import {useCallback, useEffect, useState} from 'react';

import {
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {SplitModePreview} from '../../../components/SplitModePreview';
import {plugins} from '../../../defaults/md-plugins';

import {initialMarkup} from './markup';

type InlineFormattingDemoProps = {
    structuralInlineFormatting: boolean;
};

export function InlineFormattingDemo({structuralInlineFormatting}: InlineFormattingDemoProps) {
    const [markup, setMarkup] = useState(initialMarkup);

    const renderPreview = useCallback<RenderPreview>(
        ({getValue, md}) => (
            <SplitModePreview
                getValue={getValue}
                allowHTML={md.html}
                linkify={md.linkify}
                linkifyTlds={md.linkifyTlds}
                breaks={md.breaks}
                needToSanitizeHtml
                disableMarkdownItAttrs
                plugins={plugins}
            />
        ),
        [],
    );

    const editor = useMarkdownEditor(
        {
            initial: {mode: 'markup', markup, splitModeEnabled: true},
            md: {linkify: true, breaks: true},
            experimental: {structuralInlineFormatting},
            markupConfig: {renderPreview, splitMode: 'horizontal'},
        },
        [structuralInlineFormatting, renderPreview],
    );

    useEffect(() => {
        const saveMarkup = () => setMarkup(editor.getValue());
        editor.on('change', saveMarkup);
        return () => editor.off('change', saveMarkup);
    }, [editor]);

    return (
        <PlaygroundLayout
            title="Inline formatting"
            editor={editor}
            view={({className}) => (
                <MarkdownEditorView
                    autofocus
                    stickyToolbar={false}
                    settingsVisible
                    editor={editor}
                    className={className}
                />
            )}
        />
    );
}
