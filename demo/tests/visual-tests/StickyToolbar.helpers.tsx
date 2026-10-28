import type {CSSProperties} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';

export function StickyToolbar({offset}: {offset: string}) {
    const editor = useMarkdownEditor({
        initial: {
            markup: Array.from({length: 30}, (_, index) => `Paragraph ${index + 1}`).join('\n\n'),
            mode: 'wysiwyg',
        },
    });

    return (
        <div
            data-qa="sticky-scroll-container"
            style={
                {
                    marginTop: 120,
                    height: 240,
                    width: 850,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    border: '3px solid transparent',
                    '--g-md-toolbar-sticky-offset': offset,
                } as CSSProperties
            }
        >
            <div style={{height: 50}} />
            <MarkdownEditorView editor={editor} settingsVisible={false} stickyToolbar />
        </div>
    );
}
