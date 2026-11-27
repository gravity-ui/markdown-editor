import {useState} from 'react';

import {
    MarkdownWysiwygEditorProvider,
    MarkdownWysiwygEditorView,
    useMarkdownWysiwygEditor,
    useMarkdownWysiwygEditorContext,
} from '@gravity-ui/markdown-editor';
import {wysiwygToolbarsPresets} from '@gravity-ui/markdown-editor/toolbars';
import {Button} from '@gravity-ui/uikit';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

export function WysiwygOnly({
    mobile = false,
    initialMarkup = '## WYSIWYG editor\n\nEdit this text, then export the Markdown.',
    viewWidth,
}: {
    mobile?: boolean;
    initialMarkup?: string;
    viewWidth?: React.CSSProperties['width'];
}) {
    const editor = useMarkdownWysiwygEditor(
        {
            initial: {markup: initialMarkup},
            mobile,
        },
        [mobile, initialMarkup],
    );

    return (
        <MarkdownWysiwygEditorProvider value={editor}>
            <PlaygroundLayout
                editor={editor}
                viewWidth={viewWidth}
                view={({className}) => (
                    <MarkdownWysiwygEditorView
                        qa="demo-md-editor"
                        className={className}
                        stickyToolbar
                        toolbarsPreset={wysiwygToolbarsPresets.full}
                    />
                )}
                actions={() => <ExportMarkdown />}
            />
        </MarkdownWysiwygEditorProvider>
    );
}

function ExportMarkdown() {
    const editor = useMarkdownWysiwygEditorContext();
    const [markup, setMarkup] = useState<string>();

    return (
        <>
            <Button onClick={() => setMarkup(editor?.getValue())}>Export Markdown</Button>
            {markup !== undefined && <pre data-qa="standalone-export">{markup}</pre>}
        </>
    );
}
