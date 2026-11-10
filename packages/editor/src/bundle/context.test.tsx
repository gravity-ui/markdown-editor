import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {MarkdownEditorProvider, useMarkdownEditorContext} from './context';
import type {MarkdownEditorInstance} from './types';
import {useMarkdownEditor} from './useMarkdownEditor';

describe('useMarkdownEditorContext', () => {
    let root: Root;
    let value: MarkdownEditorInstance | null;
    let renders: number;

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        root = createRoot(document.createElement('div'));
        renders = 0;
    });

    afterEach(() => {
        act(() => root.unmount());
        vi.unstubAllGlobals();
    });

    it('should return null without a provider or with a null value', () => {
        act(() => root.render(<Reader />));
        expect(value).toBeNull();

        act(() =>
            root.render(
                <MarkdownEditorProvider value={null}>
                    <Reader />
                </MarkdownEditorProvider>,
            ),
        );
        expect(value).toBeNull();
    });

    it('should return the instance directly without subscribing to its events', () => {
        let editor!: MarkdownEditorInstance;
        function Owner() {
            editor = useMarkdownEditor({initial: {mode: 'markup'}});
            return (
                <MarkdownEditorProvider value={editor}>
                    <Reader />
                </MarkdownEditorProvider>
            );
        }
        act(() => root.render(<Owner />));
        expect(value).toBe(editor);
        const initialRenders = renders;

        act(() => editor.replace('updated'));

        expect(renders).toBe(initialRenders);
        expect(value).toBe(editor);
    });

    function Reader() {
        value = useMarkdownEditorContext();
        renders++;
        return null;
    }
});
