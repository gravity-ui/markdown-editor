import {createRef} from 'react';

import {Toaster, ToasterProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {configure} from '../configure';

import {MarkdownEditorView} from './MarkdownEditorView';
import {MarkdownEditorProvider, useMarkdownEditorContext} from './context';
import type {MarkdownEditorInstance} from './types';
import {useMarkdownEditor} from './useMarkdownEditor';

describe('MarkdownEditorView', () => {
    let root: Root;
    let container: HTMLDivElement;

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        vi.unstubAllGlobals();
        configure({lang: undefined});
    });

    it('should require an instance from props or context', () => {
        expect(() => renderToStaticMarkup(<MarkdownEditorView stickyToolbar={false} />)).toThrow(
            'an instance of the editor must be passed through the props or context',
        );
    });

    it('should prefer the explicit instance without replacing the context', () => {
        const ref = createRef<HTMLDivElement>();
        let outer!: MarkdownEditorInstance;
        let nested: MarkdownEditorInstance | null = null;

        function Preview() {
            nested = useMarkdownEditorContext();
            return <span>explicit preview</span>;
        }

        function Owner() {
            outer = useMarkdownEditor({});
            const editor = useMarkdownEditor({
                initial: {mode: 'markup'},
                markupConfig: {renderPreview: () => <Preview />},
            });
            editor.changePreviewVisible(true);
            return (
                <MarkdownEditorProvider value={outer}>
                    <MarkdownEditorView
                        editor={editor}
                        ref={ref}
                        stickyToolbar={false}
                        settingsVisible={false}
                        qa="editor"
                        className="custom-editor"
                    />
                </MarkdownEditorProvider>
            );
        }

        act(() =>
            root.render(
                <ToasterProvider toaster={new Toaster()}>
                    <Owner />
                </ToasterProvider>,
            ),
        );

        expect(container.textContent).toBe('explicit preview');
        expect(nested).toBe(outer);
        expect(ref.current).toBe(container.firstElementChild);
        expect(ref.current?.getAttribute('data-qa')).toBe('editor');
        expect(ref.current?.classList.contains('custom-editor')).toBe(true);
    });

    it.each([
        ['the localized default', undefined, 'Добавьте вашу разметку'],
        ['the explicit', 'Custom placeholder', 'Custom placeholder'],
    ])('should show %s markup placeholder', (_name, placeholder, expected) => {
        configure({lang: 'ru'});
        function Owner() {
            const editor = useMarkdownEditor({
                initial: {mode: 'markup', toolbarVisible: false},
                markupConfig: {placeholder},
            });
            return (
                <MarkdownEditorView editor={editor} stickyToolbar={false} settingsVisible={false} />
            );
        }

        act(() =>
            root.render(
                <ToasterProvider toaster={new Toaster()}>
                    <Owner />
                </ToasterProvider>,
            ),
        );

        expect(container.querySelector('.cm-placeholder')?.textContent).toBe(expected);
    });
});
