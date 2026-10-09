import {useState} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Button, ThemeProvider} from '@gravity-ui/uikit';

const initialMarkup =
    'Before:footnote[**Formatted** text and a [link](https://example.com)].\n\nCustom:footnote[Custom marker]{marker="*"}.\n\nAfter:footnote[Second automatic note].';

export function FootnoteEditor({
    theme = 'light',
    markup = initialMarkup,
}: {
    theme?: 'light' | 'dark';
    markup?: string;
}) {
    const editor = useMarkdownEditor({initial: {markup, mode: 'wysiwyg'}});
    const [saved, setSaved] = useState(markup);
    return (
        <ThemeProvider theme={theme}>
            <div style={{width: 700, paddingTop: 100, paddingBottom: 100}}>
                <MarkdownEditorView editor={editor} settingsVisible={false} stickyToolbar={false} />
                <Button onClick={() => setSaved(editor.getValue())}>Save document</Button>
                <output data-qa="footnote-markup" style={{display: 'none'}}>
                    {saved}
                </output>
            </div>
        </ThemeProvider>
    );
}
