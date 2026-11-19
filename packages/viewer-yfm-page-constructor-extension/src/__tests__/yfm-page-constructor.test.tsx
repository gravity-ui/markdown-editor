import {type ReactNode, StrictMode} from 'react';

import {MarkdownViewer, ViewerTargets} from '@gravity-ui/markdown-viewer';
import {Theme} from '@gravity-ui/page-constructor';
import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {YfmPageConstructor, type YfmPageConstructorProps} from '../index';

// Loading the real renderer can time out in CI. The browser tests cover it in both themes.
vi.mock('@gravity-ui/page-constructor', () => ({
    Theme: {Light: 'light', Dark: 'dark'},
    PageConstructorProvider: ({children, theme}: {children: ReactNode; theme: Theme}) => (
        <div data-theme={theme}>{children}</div>
    ),
    PageConstructor: ({content}: {content: {blocks: {title: string}[]}}) => (
        <h1>{content.blocks[0].title}</h1>
    ),
}));

const meta = {script: ['_assets/page-constructor.js']};
const html = createHtml('Title');

describe('YfmPageConstructor', () => {
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
        const view = (currentMeta?: YfmPageConstructorProps['meta']) => (
            <StrictMode>
                <MarkdownViewer html={html} qa="active">
                    <YfmPageConstructor meta={currentMeta} />
                </MarkdownViewer>
                <MarkdownViewer html={html} qa="other">
                    <YfmPageConstructor meta={{script: ['other.js']}} />
                </MarkdownViewer>
            </StrictMode>
        );

        await render(view());
        expect(container.querySelector('h1')).toBeNull();

        await render(view(meta));
        expect(container.querySelector('[data-qa="active"] h1')?.textContent).toBe('Title');
        expect(container.querySelector('[data-qa="other"] h1')).toBeNull();
    });

    it('should render updated HTML and unmount blocks from the old host', async () => {
        const view = (content: string) => (
            <MarkdownViewer html={content}>
                <YfmPageConstructor meta={meta} />
            </MarkdownViewer>
        );
        await render(view(html));
        const host = container.querySelector('.yfm-page-constructor');
        expect(host?.querySelector('h1')?.textContent).toBe('Title');

        await render(view(createHtml('Updated title')));

        expect(container.querySelector('h1')?.textContent).toBe('Updated title');
        expect(host?.querySelector('h1')).toBeNull();
    });

    it('should remove only its own slot when metadata is disabled', async () => {
        const view = (currentMeta?: YfmPageConstructorProps['meta']) => (
            <MarkdownViewer html={html}>
                <YfmPageConstructor meta={currentMeta} />
                <ViewerTargets selector=".yfm-page-constructor">
                    {() => <span data-other>Another extension</span>}
                </ViewerTargets>
            </MarkdownViewer>
        );
        await render(view(meta));
        const foreign = container.querySelector('[data-other]');
        expect(foreign?.textContent).toBe('Another extension');
        expect(container.querySelector('h1')).not.toBeNull();

        await render(view());

        expect(container.querySelector('h1')).toBeNull();
        expect(container.querySelector('[data-other]')).toBe(foreign);
    });

    it('should show a payload error and keep other blocks visible', async () => {
        const onError = vi.fn();
        vi.spyOn(console, 'error').mockImplementation(() => {});

        await render(
            <MarkdownViewer
                html={html + '<div class="yfm-page-constructor" data-content-encoded="%"></div>'}
            >
                <YfmPageConstructor meta={meta} onError={onError} />
            </MarkdownViewer>,
        );

        expect(container.querySelector('h1')?.textContent).toBe('Title');
        expect(container.textContent).toContain('URI malformed');
        expect(onError).toHaveBeenCalledWith(expect.any(URIError));
    });

    it('should use a custom runtime, selector and theme', async () => {
        await render(
            <MarkdownViewer html={html.replace('yfm-page-constructor', 'custom-block')}>
                <YfmPageConstructor
                    meta={{script: ['custom:page-constructor']}}
                    runtime={{script: 'custom:page-constructor', style: 'custom:styles'}}
                    selector=".custom-block"
                    theme={Theme.Dark}
                />
            </MarkdownViewer>,
        );

        expect(container.querySelector('h1')?.textContent).toBe('Title');
        expect(container.querySelector('.custom-block [data-theme="dark"]')).not.toBeNull();
    });

    async function render(children: ReactNode) {
        await act(async () => root.render(<ThemeProvider theme="light">{children}</ThemeProvider>));
        await act(async () => vi.dynamicImportSettled());
    }
});

function createHtml(title: string) {
    const content = {blocks: [{type: 'header-block', title, description: 'Description'}]};
    return `<div class="yfm-page-constructor" data-content-encoded="${encodeURIComponent(
        JSON.stringify(content),
    )}"></div>`;
}
