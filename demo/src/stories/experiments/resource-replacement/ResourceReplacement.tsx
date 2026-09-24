import {useId, useRef, useState} from 'react';

import {
    type MarkdownEditorMode,
    MarkdownEditorView,
    type ResourceReplacementEvent,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {Button} from '@gravity-ui/uikit';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

import {
    FILE_MARKDOWN,
    IMAGE_MARKDOWN,
    INITIAL_MARKDOWN,
    SOURCE_URL,
    TARGET_URL,
    resolveResources,
    resourceMetadata,
} from './resourceReplacement';

import './ResourceReplacement.scss';

type ResourceReplacementDemoProps = {initialMode: MarkdownEditorMode};

const statusLabels = {
    pending: 'Processing…',
    succeeded: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
} satisfies Record<ResourceReplacementEvent['status'], string>;

function MarkdownSample({label, value}: {label: string; value: string}) {
    const id = useId();
    const input = useRef<HTMLTextAreaElement>(null);
    const [message, setMessage] = useState('');

    async function copy() {
        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error('Clipboard API is unavailable');
            }
            await navigator.clipboard.writeText(value);
            setMessage('Copied. Paste into the editor with Ctrl+V / Cmd+V.');
        } catch {
            input.current?.focus();
            input.current?.select();
            setMessage(
                'Automatic copy is unavailable. Copy the selected text with Ctrl+C / Cmd+C.',
            );
        }
    }

    return (
        <div className="resource-replacement-demo__sample">
            <label htmlFor={id}>{label}</label>
            <textarea id={id} ref={input} readOnly rows={3} value={value} spellCheck={false} />
            <div>
                <Button onClick={copy}>Copy {label}</Button>
            </div>
            <span role="status">{message}</span>
        </div>
    );
}

function ResourceReplacementEditor({initialMode}: ResourceReplacementDemoProps) {
    const [operations, setOperations] = useState<Record<string, ResourceReplacementEvent>>({});
    const editor = useMarkdownEditor({
        initial: {mode: initialMode, markup: INITIAL_MARKDOWN},
        wysiwygConfig: {extensions: resourceMetadata},
        resourceReplacement: {
            triggers: ['paste', 'drop'],
            resolve: resolveResources,
            onChange(event) {
                setOperations((previous) => ({...previous, [event.operationId]: event}));
            },
        },
    });
    const events = Object.values(operations);
    const pendingCount = events.filter(({status}) => status === 'pending').length;
    let summary = 'Ready. Copy and paste a sample to start.';
    if (pendingCount > 0) {
        summary = `Processing ${pendingCount} operation(s)…`;
    } else if (events.length > 0) {
        summary = 'No operations pending. See results below.';
    }

    return (
        <PlaygroundLayout
            title="Resource Replacement"
            editor={editor}
            actions={() => (
                <div className="resource-replacement-demo">
                    <div className="resource-replacement-demo__images">
                        <figure>
                            <img
                                src={SOURCE_URL}
                                alt="Original resource"
                                width={160}
                                height={160}
                            />
                            <figcaption>Original image / attachment</figcaption>
                        </figure>
                        <figure>
                            <img
                                src={TARGET_URL}
                                alt="Replacement resource"
                                width={160}
                                height={160}
                            />
                            <figcaption>Image / attachment after replacement</figcaption>
                        </figure>
                    </div>
                    <p>
                        Copy an image or file Markdown sample below and paste it into a new
                        paragraph in the editor (Ctrl+V / Cmd+V). You can also select and copy the
                        text manually with Ctrl+C / Cmd+C.
                    </p>
                    <p>
                        Replacement takes about 3 seconds. Both samples use the same source image;
                        the file sample is an image attachment. Only this source URL is replaced for
                        the matching resource kind. Other resources and ordinary links are
                        unchanged. This demo simulates a response; it does not copy files to a
                        server.
                    </p>
                    <div className="resource-replacement-demo__samples">
                        <MarkdownSample label="Image Markdown" value={IMAGE_MARKDOWN} />
                        <MarkdownSample label="File Markdown" value={FILE_MARKDOWN} />
                    </div>
                    <p>
                        Initial content does not start processing. Pasting a sample also updates all
                        existing resources with the same kind and source URL. Paste again before the
                        first operation finishes to see parallel operations.
                    </p>
                    <p>
                        Current Markdown is shown below the editor in ProseMirror and directly in
                        the editor in CodeMirror. Watch the URL change: image src and file href are
                        both serialized into their respective Markdown samples (the file uses src).
                    </p>
                    <div role="status" aria-live="polite">
                        {summary}
                        {events.length > 0 && (
                            <ul>
                                {events.map(({operationId, status, error}) => (
                                    <li key={operationId}>
                                        {operationId}: {statusLabels[status]}
                                        {status === 'failed' && (
                                            <span>
                                                {' — '}
                                                {error instanceof Error
                                                    ? error.message
                                                    : String(error ?? 'Unknown error')}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
            view={({className}) => (
                <MarkdownEditorView
                    stickyToolbar
                    settingsVisible
                    editor={editor}
                    className={className}
                />
            )}
        />
    );
}

export function ResourceReplacementDemo(props: ResourceReplacementDemoProps) {
    return <ResourceReplacementEditor key={props.initialMode} {...props} />;
}
