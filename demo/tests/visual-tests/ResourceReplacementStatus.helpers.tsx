import {useRef} from 'react';

import {
    MarkdownEditorView,
    type ResourceReplacementResult,
    type ToolbarsPreset,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';

const emptyToolbar: ToolbarsPreset = {
    items: {},
    orders: {wysiwygMain: [], markupMain: []},
};

export function ResourceReplacementStatusExample({
    mode,
    customToolbar = false,
    mobile = false,
}: {
    mode: 'wysiwyg' | 'markup';
    customToolbar?: boolean;
    mobile?: boolean;
}) {
    const finish = useRef<() => void>();
    const editor = useMarkdownEditor({
        initial: {mode},
        mobile,
        wysiwygConfig: {
            extensions: (builder) => {
                builder.overrideNodeSpec('image', (spec) => ({
                    ...spec,
                    _resource: {kind: 'image', valueAttribute: 'src'},
                }));
            },
        },
        resourceReplacement: {
            triggers: ['paste'],
            resolve: () =>
                new Promise<ResourceReplacementResult>((resolve) => {
                    finish.current = () => resolve({replacements: []});
                }),
        },
    });
    return (
        <div style={{width: 240}}>
            <MarkdownEditorView
                editor={editor}
                stickyToolbar={false}
                toolbarsPreset={customToolbar ? emptyToolbar : undefined}
            />
            <button
                onClick={() => {
                    const [pending] = editor.getPendingResourceReplacements();
                    if (pending) editor.cancelResourceReplacement(pending.operationId);
                }}
            >
                Cancel first request
            </button>
            <button onClick={() => finish.current?.()}>Complete last request</button>
        </div>
    );
}
