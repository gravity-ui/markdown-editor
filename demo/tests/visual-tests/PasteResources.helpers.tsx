import {useRef, useState} from 'react';

import {
    MarkdownEditorView,
    type PasteOperationEvent,
    type PasteResourceResolution,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';

export function PasteResources({mode = 'wysiwyg'}: {mode?: 'wysiwyg' | 'markup'}) {
    const finish = useRef<(value: PasteResourceResolution) => void>();
    const replacements = useRef<PasteResourceResolution>({replacements: []});
    const [events, setEvents] = useState<PasteOperationEvent[]>([]);
    const [value, setValue] = useState('');
    const [calls, setCalls] = useState(0);
    const editor = useMarkdownEditor({
        initial: {mode, markup: 'before'},
        markupConfig: {parseHtmlOnPaste: true},
        paste: {
            resolvePastedResources: (resources) => {
                setCalls((count) => count + 1);
                replacements.current = {
                    replacements: resources.map((resource) => ({
                        kind: resource.kind,
                        oldPath: resource.path,
                        newPath:
                            resource.kind === 'image'
                                ? '/assets/test-image.jpg?copied'
                                : '/copied/file',
                    })),
                };
                return new Promise((resolve) => {
                    finish.current = resolve;
                });
            },
            onPasteOperationChange: (event) => setEvents((previous) => [...previous, event]),
        },
    });
    return (
        <div>
            <MarkdownEditorView editor={editor} stickyToolbar={false} />
            <button onClick={() => editor.insert('![label](/assets/test-image.jpg)')}>
                Seed image
            </button>
            <button onClick={() => finish.current?.(replacements.current)}>Resolve paste</button>
            <button
                onClick={() => {
                    const [pending] = editor.getPendingPasteOperations();
                    if (pending) editor.cancelPaste(pending.operationId);
                }}
            >
                Cancel paste
            </button>
            <button
                onClick={() => {
                    editor.insert('typed');
                }}
            >
                Mutate editor
            </button>
            <button
                onClick={() =>
                    editor.setEditorMode(editor.currentMode === 'wysiwyg' ? 'markup' : 'wysiwyg')
                }
            >
                Switch mode
            </button>
            <button onClick={() => setValue(editor.getValue())}>Read value</button>
            <output data-testid="calls">{calls}</output>
            <output data-testid="events">{events.map((event) => event.status).join(',')}</output>
            <pre data-testid="value">{value}</pre>
            <input aria-label="Other input" />
        </div>
    );
}
