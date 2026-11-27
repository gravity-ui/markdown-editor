import {
    MarkdownEditorView,
    MarkdownWysiwygEditorView,
    useMarkdownEditor,
    useMarkdownWysiwygEditor,
} from '@gravity-ui/markdown-editor';
import {ThemeProvider, ToasterProvider} from '@gravity-ui/uikit';
import {toaster} from '@gravity-ui/uikit/toaster-singleton';
import type {} from 'prosemirror-dev-toolkit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, assert, beforeEach, expect, it, vi} from 'vitest';

import {PlaygroundLayout} from '../PlaygroundLayout';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

it('should attach standalone devtools to its document and remove them on unmount', async () => {
    await act(async () => root.render(<Standalone />));
    await act(async () => vi.dynamicImportSettled());
    expect(document.querySelector('prosemirror-dev-toolkit')).not.toBeNull();
    expect(window.editorView?.state.doc.textContent).toBe('Initial text');

    await act(async () => root.render(null));
    expect(document.querySelector('prosemirror-dev-toolkit')).toBeNull();
});

it('should attach and remove devtools on the first markup to wysiwyg round trip', async () => {
    await act(async () => root.render(<DualMode />));
    expect(document.querySelector('prosemirror-dev-toolkit')).toBeNull();
    const editor = window.mdEditor;
    assert(editor && 'setEditorMode' in editor);

    await act(async () => editor.setEditorMode('wysiwyg'));
    await act(async () => vi.dynamicImportSettled());
    expect(document.querySelector('prosemirror-dev-toolkit')).not.toBeNull();
    expect(window.editorView?.state.doc.textContent).toBe('Dual-mode text');

    await act(async () => editor.setEditorMode('markup'));
    expect(document.querySelector('prosemirror-dev-toolkit')).toBeNull();
});

function DualMode() {
    const editor = useMarkdownEditor({
        preset: 'zero',
        initial: {markup: 'Dual-mode text', mode: 'markup'},
    });
    return (
        <ThemeProvider>
            <ToasterProvider toaster={toaster}>
                <PlaygroundLayout
                    editor={editor}
                    view={() => <MarkdownEditorView editor={editor} stickyToolbar={false} />}
                />
            </ToasterProvider>
        </ThemeProvider>
    );
}

function Standalone() {
    const editor = useMarkdownWysiwygEditor({preset: 'zero', initial: {markup: 'Initial text'}});
    return (
        <ThemeProvider>
            <ToasterProvider toaster={toaster}>
                <PlaygroundLayout
                    editor={editor}
                    view={() => <MarkdownWysiwygEditorView editor={editor} stickyToolbar={false} />}
                />
            </ToasterProvider>
        </ThemeProvider>
    );
}
