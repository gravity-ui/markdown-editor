import {useRef} from 'react';

import {
    BaseTooltipPlugin,
    MarkdownEditorView,
    isGapCursorSelection,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';

// A block toolbar models extensions with nested containers. The parent deliberately
// has no paragraphs between its children, so keyboard navigation needs a gap cursor.
export function GapCursorEditor() {
    const output = useRef<HTMLOutputElement>(null);
    const editor = useMarkdownEditor({
        initial: {markup: '', mode: 'wysiwyg', toolbarVisible: false},
        wysiwygConfig: {
            extensions: (builder) => {
                builder.addPlugin(
                    () =>
                        new Plugin({
                            view(view) {
                                const {schema} = view.state;
                                const paragraph = (text: string) =>
                                    schema.node('paragraph', null, schema.text(text));
                                const block = (...content: Node[]) =>
                                    schema.node('blockquote', null, content);
                                const tooltip = new BaseTooltipPlugin.BaseTooltipPluginView(view, {
                                    idPrefix: 'nested-block-tooltip',
                                    nodeType: schema.nodes.blockquote,
                                    content: (_view, {node}) => (
                                        <div data-qa="block-toolbar">{node.textContent}</div>
                                    ),
                                });

                                // Construct adjacent containers without a Markdown parser merging them.
                                // Wait until the editor and all its plugin views are initialized.
                                queueMicrotask(() => {
                                    if (view.isDestroyed) return;
                                    view.dispatch(
                                        view.state.tr
                                            .replaceWith(0, view.state.doc.content.size, [
                                                paragraph('Before'),
                                                block(
                                                    block(paragraph('First')),
                                                    block(paragraph('Second')),
                                                ),
                                                paragraph('After'),
                                            ])
                                            .setMeta('addToHistory', false),
                                    );
                                });

                                return {
                                    update(currentView) {
                                        tooltip.update(currentView);
                                        const {selection} = currentView.state;
                                        if (output.current) {
                                            output.current.textContent = JSON.stringify({
                                                type: isGapCursorSelection(selection)
                                                    ? 'gap'
                                                    : 'text',
                                                from: selection.from,
                                                parent: selection.$from.parent.type.name,
                                                parentText: selection.$from.parent.textContent,
                                            });
                                        }
                                    },
                                    destroy() {
                                        tooltip.destroy();
                                    },
                                };
                            },
                        }),
                );
            },
        },
    });

    return (
        <div style={{marginTop: 120, width: 700}}>
            <MarkdownEditorView editor={editor} settingsVisible={false} stickyToolbar={false} />
            <output ref={output} data-qa="gap-probe" hidden />
        </div>
    );
}
