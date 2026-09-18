import {useRef, useState} from 'react';

import {FILE_TOKEN} from '@diplodoc/file-extension';
import {
    MarkdownEditorView,
    type ResourceReplacementEvent,
    type ResourceReplacementResult,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';

export function PasteResources({mode = 'wysiwyg'}: {mode?: 'wysiwyg' | 'markup'}) {
    const finish = useRef<(value: ResourceReplacementResult) => void>();
    const replacements = useRef<ResourceReplacementResult>({replacements: []});
    const [events, setEvents] = useState<ResourceReplacementEvent[]>([]);
    const [value, setValue] = useState('');
    const [calls, setCalls] = useState(0);
    const editor = useMarkdownEditor({
        initial: {mode, markup: 'before'},
        markupConfig: {parseHtmlOnPaste: true},
        resourceReplacement: {
            resources: {
                image: {kind: 'image', urlAttribute: 'src', nameAttribute: 'alt'},
                [FILE_TOKEN]: {kind: 'file', urlAttribute: 'href', nameAttribute: 'download'},
            },
            triggers: ['paste', 'drop'],
            resolve: (resources) => {
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
            onChange: (event) => setEvents((previous) => [...previous, event]),
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
                    const [pending] = editor.getPendingResourceReplacements();
                    if (pending) editor.cancelResourceReplacement(pending.operationId);
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
