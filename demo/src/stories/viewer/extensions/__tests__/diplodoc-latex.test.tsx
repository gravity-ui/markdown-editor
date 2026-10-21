import {type ReactNode, StrictMode} from 'react';

import '@diplodoc/latex-extension/runtime';
import {MarkdownViewer, ViewerTargets} from '@gravity-ui/markdown-viewer';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {DiplodocLatex} from '../DiplodocLatex';
import type {DiplodocLatexOptions, TransformMeta} from '../types';

const meta = {
    script: ['_assets/latex-extension.js'],
    style: ['_assets/latex-extension.css'],
};
const html = '<span class="yfm-latex" data-content="a%5E2"></span>';

describe('DiplodocLatex', () => {
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
        vi.restoreAllMocks();
    });

    it('should render only the viewer with matching metadata', async () => {
        const view = (currentMeta?: TransformMeta) => (
            <StrictMode>
                <MarkdownViewer html={html} qa="active">
                    <DiplodocLatex meta={currentMeta} />
                </MarkdownViewer>
                <MarkdownViewer html={html} qa="other">
                    <DiplodocLatex />
                </MarkdownViewer>
            </StrictMode>
        );

        await render(view());
        expect(container.querySelector('.katex')).toBeNull();

        await render(view(meta));
        expect(container.querySelector('[data-qa="active"] .katex')).not.toBeNull();
        expect(container.querySelector('[data-qa="other"] .katex')).toBeNull();
    });

    it('should render a viewer inside another viewer slot', async () => {
        await render(
            <MarkdownViewer html='<div class="nested-viewer"></div>'>
                <ViewerTargets selector=".nested-viewer" as="div">
                    {() => (
                        <MarkdownViewer html={html}>
                            <DiplodocLatex meta={meta} />
                        </MarkdownViewer>
                    )}
                </ViewerTargets>
            </MarkdownViewer>,
        );

        expect(container.querySelector('.katex')).not.toBeNull();
    });

    it('should keep rendered nodes on an unrelated rerender', async () => {
        const view = () => (
            <MarkdownViewer html={html}>
                <DiplodocLatex meta={meta} />
            </MarkdownViewer>
        );
        await render(view());
        const formula = container.querySelector('.katex');
        expect(formula).not.toBeNull();

        await render(view());

        expect(container.querySelector('.katex')).toBe(formula);
    });

    it('should render updated HTML and handle a document without formulas', async () => {
        const view = (content: string, currentMeta?: TransformMeta) => (
            <MarkdownViewer html={content}>
                <DiplodocLatex meta={currentMeta} />
            </MarkdownViewer>
        );
        await render(view(html, meta));
        await render(view('<span class="yfm-latex" data-content="b%5E2"></span>', meta));
        expect(container.querySelector('annotation')?.textContent).toBe('b^2');

        await render(view('<p>Plain text</p>'));
        expect(container.querySelector('.katex')).toBeNull();
    });

    it('should leave formulas and foreign slots when the adapter is removed', async () => {
        const view = (showAdapter: boolean, children?: ReactNode) => (
            <MarkdownViewer html={html}>
                {showAdapter && <DiplodocLatex meta={meta} />}
                {children}
            </MarkdownViewer>
        );
        await render(view(true));
        const formula = container.querySelector('.katex');
        expect(formula).not.toBeNull();
        const slots = (
            <ViewerTargets selector=".yfm-latex">
                {() => (
                    <span className="yfm-latex" data-content="x%5E2">
                        React formula
                    </span>
                )}
            </ViewerTargets>
        );

        await render(view(true, slots));
        const slot = container.querySelector('[data-markdown-viewer-slot]');
        expect(slot).not.toBeNull();

        await render(view(false, slots));

        expect(container.querySelector('.katex')).toBe(formula);
        expect(container.querySelector('[data-markdown-viewer-slot]')).toBe(slot);
        expect(slot?.textContent).toBe('React formula');
    });

    it('should protect slots added before pending rendering finishes', async () => {
        const content = html + '<span class="yfm-latex protected" data-content="y%5E2"></span>';
        const view = (withSlots: boolean) => (
            <MarkdownViewer html={content}>
                <DiplodocLatex meta={meta} />
                {withSlots && (
                    <ViewerTargets selector=".protected">
                        {() => (
                            <span className="yfm-latex" data-content="x%5E2">
                                React formula
                            </span>
                        )}
                    </ViewerTargets>
                )}
            </MarkdownViewer>
        );
        act(() => root.render(view(false)));
        act(() => root.render(view(true)));
        await act(async () => vi.dynamicImportSettled());

        expect(container.querySelectorAll('.katex')).toHaveLength(1);
        expect(container.querySelector('.protected .katex')).toBeNull();
        expect(container.querySelector('.protected')?.textContent).toBe('React formula');
    });

    it('should apply a custom selector, sanitize and updated KaTeX options', async () => {
        const runtime = 'custom:latex';
        const customMeta = {script: [runtime], style: [runtime]};
        const options = {
            macros: {'\\value': '42'},
            displayMode: true,
            sanitize: (rendered: string) => `<span data-sanitized>${rendered}</span>`,
        };
        const view = (currentOptions: DiplodocLatexOptions) => (
            <MarkdownViewer html='<span class="custom-formula" data-content="%5Cvalue"></span>'>
                <DiplodocLatex
                    meta={customMeta}
                    runtime={runtime}
                    selector=".custom-formula"
                    options={currentOptions}
                />
            </MarkdownViewer>
        );

        await render(view(options));
        expect(container.querySelector('[data-sanitized] .katex-display')).not.toBeNull();
        expect(container.querySelector('math mn')?.textContent).toBe('42');

        await render(view({...options, macros: {'\\value': '43'}}));
        expect(container.querySelector('math mn')?.textContent).toBe('43');
    });

    it('should send runtime errors to onError without logging them again', async () => {
        const onError = vi.fn();
        const logError = vi.spyOn(console, 'error').mockImplementation(() => {});

        await render(
            <MarkdownViewer html='<span class="yfm-latex" data-content="%5Cfrac%7B"></span>'>
                <DiplodocLatex meta={meta} options={{throwOnError: true}} onError={onError} />
            </MarkdownViewer>,
        );

        expect(onError).toHaveBeenCalledWith(
            expect.objectContaining({message: expect.stringContaining('KaTeX parse error')}),
        );
        expect(logError).not.toHaveBeenCalled();
    });

    async function render(children: ReactNode) {
        await act(async () => root.render(children));
        await act(async () => vi.dynamicImportSettled());
    }
});
