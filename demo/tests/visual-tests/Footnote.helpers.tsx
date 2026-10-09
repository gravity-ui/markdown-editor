import {useState} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Button, ThemeProvider} from '@gravity-ui/uikit';

import {SplitModePreview} from '../../src/components/SplitModePreview';

const initialMarkup =
    'Before[*](*first).\n\nA [selected phrase](*custom).\n\nAfter[*](*second).\n\n[*first]: **Formatted** text and a [link](https://example.com).\n\n[*custom]: Custom marker\n\n[*second]: Another note';

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

export function FootnotePreview() {
    return (
        <div style={{width: 700, padding: 100}}>
            <SplitModePreview
                getValue={() =>
                    'One[*](*same). Another[term](*same).\n\n[*same]: **Shared** explanation and a [link](https://example.com).'
                }
            />
        </div>
    );
}
