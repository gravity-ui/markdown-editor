import {useLayoutEffect, useRef, useState} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {NodeSelection, Plugin, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {MobileProvider, ThemeProvider, Toaster, ToasterProvider} from '@gravity-ui/uikit';
import * as ReactDOM from 'react-dom';

type Selection = {type: string; from: number; to: number};
type Probe = {
    view?: EditorView;
    depth: number;
    maxDepth: number;
    selections: Selection[];
    destroyed: boolean;
    updatesAfterDestroy: number;
    settled: boolean;
    publish: () => void;
};

const markup = '{% note info "Note" %}\n\nText in note\n\n{% endnote %}';
const toaster = new Toaster();

function SelectionEditor(props: {probe: Probe; startsWithNote: boolean}) {
    const {probe, startsWithNote} = props;
    const editor = useMarkdownEditor({
        initial: {
            markup: startsWithNote ? markup : `Before\n\n${markup}`,
            mode: 'wysiwyg',
            toolbarVisible: false,
        },
        wysiwygConfig: {
            extensions: (builder) => {
                builder.addPlugin(
                    () =>
                        new Plugin({
                            view(editorView) {
                                const view = editorView;
                                probe.view = view;
                                const updateState = view.updateState;
                                // Instrument this instance only, including the complete plugin update cycle.
                                view.updateState = function (state) {
                                    probe.depth += 1;
                                    probe.maxDepth = Math.max(probe.maxDepth, probe.depth);
                                    if (probe.destroyed) probe.updatesAfterDestroy += 1;
                                    probe.selections.push({
                                        type:
                                            state.selection instanceof NodeSelection
                                                ? 'node'
                                                : 'text',
                                        from: state.selection.from,
                                        to: state.selection.to,
                                    });
                                    try {
                                        return updateState.call(this, state);
                                    } finally {
                                        probe.depth -= 1;
                                        probe.publish();
                                    }
                                };
                                return {
                                    destroy() {
                                        probe.destroyed = true;
                                        probe.publish();
                                    },
                                };
                            },
                        }),
                    builder.Priority.Highest,
                );
            },
        },
    });

    return <MarkdownEditorView editor={editor} settingsVisible={false} stickyToolbar={false} />;
}

function SelectionApp({startsWithNote}: {startsWithNote: boolean}) {
    const output = useRef<HTMLOutputElement>(null);
    const [mounted, setMounted] = useState(true);
    const probe = useRef<Probe>({
        depth: 0,
        maxDepth: 0,
        selections: [],
        destroyed: false,
        updatesAfterDestroy: 0,
        settled: false,
        publish() {
            if (output.current) {
                const {view: _view, publish: _publish, ...data} = probe;
                output.current.textContent = JSON.stringify(data);
            }
        },
    }).current;

    function selectThen(action: 'move' | 'destroy') {
        const view = probe.view;
        if (!view) throw new Error('Editor view is missing');
        let notePos: number | undefined;
        view.state.doc.descendants((node, pos) => {
            if (node.type.name === 'yfm_note') notePos = pos;
        });
        if (notePos === undefined) throw new Error('Note is missing');
        view.focus();
        probe.selections = [];
        probe.maxDepth = 0;
        view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, notePos)));
        // Both actions happen before the deferred selection normalization can run.
        if (action === 'move') {
            view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1)));
        } else {
            ReactDOM.flushSync(() => setMounted(false));
        }
        queueMicrotask(() => {
            probe.settled = true;
            probe.publish();
        });
    }

    return (
        <ThemeProvider>
            <MobileProvider>
                <ToasterProvider toaster={toaster}>
                    <div style={{marginTop: 120, width: 850}}>
                        <output ref={output} data-qa="selection-probe" style={{display: 'none'}} />
                        {mounted && (
                            <SelectionEditor probe={probe} startsWithNote={startsWithNote} />
                        )}
                        <button
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                probe.selections = [];
                                probe.maxDepth = 0;
                                probe.publish();
                            }}
                        >
                            Reset probe
                        </button>
                        <button
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectThen('move')}
                        >
                            Select note then paragraph
                        </button>
                        <button
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectThen('destroy')}
                        >
                            Select note then destroy
                        </button>
                    </div>
                </ToasterProvider>
            </MobileProvider>
        </ThemeProvider>
    );
}

export function EditorPopupSelection({
    legacy,
    startsWithNote = false,
}: {
    legacy: boolean;
    startsWithNote?: boolean;
}) {
    const target = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        if (!legacy || !target.current) return undefined;
        const container = target.current;
        ReactDOM.render(<SelectionApp startsWithNote={startsWithNote} />, container);
        return () => {
            ReactDOM.unmountComponentAtNode(container);
        };
    }, [legacy, startsWithNote]);
    return legacy ? <div ref={target} /> : <SelectionApp startsWithNote={startsWithNote} />;
}
