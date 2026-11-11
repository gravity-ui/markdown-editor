import {type ReactNode, StrictMode} from 'react';

import {MarkdownViewer, ViewerTargets} from '@gravity-ui/markdown-viewer';
import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {DiplodocMermaid} from '../DiplodocMermaid';
import type {DiplodocMermaidOptions, TransformMeta} from '../types';

const {renderMermaid, useMermaid} = vi.hoisted(() => {
    const render = vi.fn();
    return {renderMermaid: render, useMermaid: vi.fn(() => render)};
});
vi.mock('@diplodoc/mermaid-extension/react', () => ({useMermaid}));

const meta = {script: ['_assets/mermaid-extension.js']};
const html = '<div class="mermaid" data-content="graph%20TD%3B%20A--%3EB"></div>';

describe('DiplodocMermaid', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.doMock('@diplodoc/mermaid-extension/runtime', () => ({}));
        renderMermaid.mockImplementation(renderDiagrams);
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should activate only matching metadata and keep other viewers unchanged', async () => {
        const view = (currentMeta?: TransformMeta) => (
            <>
                <MarkdownViewer html={html} qa="active">
                    <DiplodocMermaid meta={currentMeta} />
                </MarkdownViewer>
                <MarkdownViewer html={html} qa="other">
                    <DiplodocMermaid />
                </MarkdownViewer>
            </>
        );
        await render(view({script: ['other-runtime.js']}));
        expect(renderMermaid).not.toHaveBeenCalled();

        await render(view(meta));

        expect(container.querySelector('[data-qa="active"] text')?.textContent).toBe('forest');
        expect(container.querySelector('[data-qa="other"] svg')).toBeNull();
        const svg = container.querySelector('[data-qa="active"] svg');

        await render(view());

        expect(container.querySelector('[data-qa="active"] svg')).toBe(svg);
    });

    it('should keep a completed diagram on an unrelated rerender', async () => {
        const view = () => (
            <StrictMode>
                <MarkdownViewer html={html}>
                    <DiplodocMermaid meta={meta} theme={{light: 'forest', dark: 'dark'}} />
                </MarkdownViewer>
            </StrictMode>
        );
        await render(view());
        const svg = container.querySelector('svg');
        expect(svg).not.toBeNull();

        await render(view());

        expect(container.querySelector('svg')).toBe(svg);
        expect(renderMermaid).toHaveBeenCalledTimes(1);
    });

    it('should leave React-owned diagrams unchanged', async () => {
        await render(
            <MarkdownViewer html="<section></section>">
                <ViewerTargets selector="section">
                    {() => (
                        <b className="mermaid" data-content="graph%20TD%3B%20A--%3EB">
                            React diagram
                        </b>
                    )}
                </ViewerTargets>
                <DiplodocMermaid meta={meta} />
            </MarkdownViewer>,
        );

        expect(container.querySelector('.mermaid')?.textContent).toBe('React diagram');
        expect(renderMermaid).not.toHaveBeenCalled();
    });

    it('should apply a new theme with a custom runtime and selector', async () => {
        const view = (theme: 'forest' | 'dark') => (
            <MarkdownViewer html={html.replace('mermaid', 'diagram')}>
                <DiplodocMermaid
                    meta={{script: ['custom-mermaid.js']}}
                    runtime="custom-mermaid.js"
                    selector=".diagram"
                    theme={theme}
                />
            </MarkdownViewer>
        );
        await render(view('forest'));
        expect(container.querySelector('text')?.textContent).toBe('forest');

        await render(view('dark'));

        expect(container.querySelector('text')?.textContent).toBe('dark');
        expect(container.querySelectorAll('svg')).toHaveLength(1);
    });

    it('should select a configured Mermaid theme from the current UIKit theme', async () => {
        const view = () => (
            <MarkdownViewer html={html}>
                <DiplodocMermaid meta={meta} theme={{light: 'neutral', dark: 'base'}} />
            </MarkdownViewer>
        );
        await render(view());
        expect(container.querySelector('text')?.textContent).toBe('neutral');

        await render(view(), 'dark');

        expect(container.querySelector('text')?.textContent).toBe('base');
        expect(container.querySelectorAll('svg')).toHaveLength(1);
    });

    it('should pass Mermaid settings and the style nonce to the runtime', async () => {
        const options: DiplodocMermaidOptions = {
            fontFamily: 'monospace',
            flowchart: {curve: 'linear'},
            zoom: {showMenu: true, maximumScale: 3},
        };

        await render(
            <MarkdownViewer html={html}>
                <DiplodocMermaid meta={meta} options={options} nonce="viewer-styles" />
            </MarkdownViewer>,
        );

        expect(renderMermaid).toHaveBeenCalledWith(
            {...options, theme: 'forest', startOnLoad: false},
            expect.objectContaining({nonce: 'viewer-styles'}),
        );
    });

    it('should skip rendering when the adapter unmounts during runtime loading', async () => {
        const pending = Promise.withResolvers<void>();
        const loadRuntime = vi.fn(async () => {
            await pending.promise;
            return {};
        });
        vi.doMock('@diplodoc/mermaid-extension/runtime', loadRuntime);
        const view = (enabled: boolean) => (
            <ThemeProvider theme="light">
                <MarkdownViewer html={html}>
                    {enabled && <DiplodocMermaid meta={meta} />}
                </MarkdownViewer>
            </ThemeProvider>
        );
        await act(async () => root.render(view(true)));
        await vi.waitFor(() => expect(loadRuntime).toHaveBeenCalledOnce());
        await act(async () => root.render(view(false)));

        await act(async () => pending.resolve());
        await act(async () => vi.dynamicImportSettled());

        expect(renderMermaid).not.toHaveBeenCalled();
        expect(container.querySelector('.mermaid')?.childElementCount).toBe(0);
    });

    it('should report a failed runtime import without changing the placeholder', async () => {
        vi.doMock('@diplodoc/mermaid-extension/runtime', () => {
            throw new Error('Runtime import failed');
        });
        const onError = vi.fn();

        await render(
            <MarkdownViewer html={html}>
                <DiplodocMermaid meta={meta} onError={onError} />
            </MarkdownViewer>,
        );

        expect(onError).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
        expect(renderMermaid).not.toHaveBeenCalled();
        expect(container.querySelector('.mermaid')?.childElementCount).toBe(0);
    });

    it('should discard a pending result after the document changes', async () => {
        const pending = Promise.withResolvers<void>();
        renderMermaid.mockImplementationOnce(async (...args: Parameters<typeof renderDiagrams>) => {
            await pending.promise;
            await renderDiagrams(...args);
        });
        const view = (source: string) => (
            <MarkdownViewer html={source}>
                <DiplodocMermaid meta={meta} />
            </MarkdownViewer>
        );
        await render(view(html));
        const original = container.querySelector('.mermaid');
        await render(view(html.replace('A--%3EB', 'A--%3EC')));

        await act(async () => pending.resolve());

        expect(original?.childElementCount).toBe(0);
        expect(container.querySelector('svg')?.getAttribute('data-source')).toContain('A--%3EC');
        expect(container.querySelectorAll('svg')).toHaveLength(1);
    });

    it('should keep completed diagrams and cancel the remaining work on unmount', async () => {
        const pending = Promise.withResolvers<void>();
        renderMermaid
            .mockImplementationOnce(renderDiagrams)
            .mockImplementationOnce(async (...args: Parameters<typeof renderDiagrams>) => {
                await pending.promise;
                await renderDiagrams(...args);
            });
        const view = (enabled: boolean) => (
            <MarkdownViewer html={html + html + html}>
                {enabled && <DiplodocMermaid meta={meta} />}
            </MarkdownViewer>
        );
        await render(view(true));
        const svg = container.querySelector('svg');
        expect(svg).not.toBeNull();
        await render(view(false));

        await act(async () => pending.resolve());

        expect(container.querySelectorAll('svg')).toHaveLength(1);
        expect(container.querySelector('svg')).toBe(svg);
        expect(renderMermaid).toHaveBeenCalledTimes(2);
    });

    it('should preserve a sibling React slot across render and theme updates', async () => {
        const pending = Promise.withResolvers<void>();
        renderMermaid.mockImplementationOnce(async (...args: Parameters<typeof renderDiagrams>) => {
            await pending.promise;
            await renderDiagrams(...args);
        });
        const view = (withSlot: boolean, theme: 'forest' | 'dark' = 'forest') => (
            <MarkdownViewer html={html}>
                <DiplodocMermaid meta={meta} theme={theme} />
                {withSlot && (
                    <ViewerTargets selector=".mermaid">{() => <b>React diagram</b>}</ViewerTargets>
                )}
            </MarkdownViewer>
        );
        await render(view(false));
        await render(view(true));

        await act(async () => pending.resolve());

        expect(container.querySelector('b')?.textContent).toBe('React diagram');
        expect(container.querySelector('text')?.textContent).toBe('forest');

        const slotContent = container.querySelector('b');
        await render(view(true, 'dark'));

        expect(container.querySelector('b')).toBe(slotContent);
        expect(container.querySelector('text')?.textContent).toBe('dark');
    });

    it('should keep a completed diagram and its handlers until remount', async () => {
        const onClick = vi.fn();
        renderMermaid.mockImplementationOnce(async (_config, {nodes}) => {
            const node = nodes[0];
            node.innerHTML = '<svg></svg>';
            node.addEventListener('click', onClick);
        });
        const view = (enabled: boolean) => (
            <MarkdownViewer html={html}>
                {enabled && <DiplodocMermaid meta={meta} />}
                <ViewerTargets selector=".mermaid">{() => <b>React diagram</b>}</ViewerTargets>
            </MarkdownViewer>
        );
        await render(view(true));
        const svg = container.querySelector('svg');
        expect(svg).not.toBeNull();
        const slotContent = container.querySelector('b');
        expect(slotContent).not.toBeNull();

        await render(view(false));

        expect(container.querySelector('svg')).toBe(svg);
        expect(container.querySelector('b')).toBe(slotContent);
        svg?.dispatchEvent(new MouseEvent('click', {bubbles: true}));
        expect(onClick).toHaveBeenCalledTimes(1);

        await render(view(true));

        expect(container.querySelectorAll('svg')).toHaveLength(1);
        expect(container.querySelector('svg')).not.toBe(svg);
    });

    it('should finish all diagrams in one viewer before starting the next viewer', async () => {
        const pending = Promise.withResolvers<void>();
        renderMermaid
            .mockImplementationOnce(renderDiagrams)
            .mockImplementationOnce(async (...args: Parameters<typeof renderDiagrams>) => {
                await pending.promise;
                await renderDiagrams(...args);
            });
        await render(
            <>
                <MarkdownViewer html={html + html}>
                    <DiplodocMermaid meta={meta} theme="forest" />
                </MarkdownViewer>
                <MarkdownViewer html={html}>
                    <DiplodocMermaid meta={meta} theme="dark" />
                </MarkdownViewer>
            </>,
        );
        expect(renderMermaid).toHaveBeenCalledTimes(2);

        await act(async () => pending.resolve());

        expect(renderMermaid.mock.calls.map(([config]) => config.theme)).toEqual([
            'forest',
            'forest',
            'dark',
        ]);
    });

    it('should report a runtime failure and continue with the next viewer', async () => {
        const error = new Error('Mermaid failed');
        const onError = vi.fn();
        renderMermaid.mockRejectedValueOnce(error);

        await render(
            <>
                <MarkdownViewer html={html} qa="failed">
                    <DiplodocMermaid meta={meta} onError={onError} />
                </MarkdownViewer>
                <MarkdownViewer html={html} qa="next">
                    <DiplodocMermaid meta={meta} />
                </MarkdownViewer>
            </>,
        );

        expect(onError).toHaveBeenCalledExactlyOnceWith(error);
        expect(container.querySelector('[data-qa="failed"] .mermaid')?.childElementCount).toBe(0);
        expect(container.querySelector('[data-qa="next"] text')?.textContent).toBe('forest');
    });

    async function render(children: ReactNode, theme: 'light' | 'dark' = 'light') {
        await act(async () => root.render(<ThemeProvider theme={theme}>{children}</ThemeProvider>));
        await act(async () => vi.dynamicImportSettled());
    }
});

async function renderDiagrams({theme}: {theme?: string}, {nodes}: {nodes: HTMLElement[]}) {
    for (const node of nodes) {
        node.innerHTML = `<svg data-source="${node.getAttribute('data-content')}"><text>${theme}</text></svg>`;
    }
}
