import {type ReactNode, StrictMode} from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {act} from '../../../tests/utils/act';
import {YfmCodeBlockActions} from '../../extensions';
import {MarkdownViewer, ViewerTargets} from '../../index';

describe('YfmCodeBlockActions', () => {
    let container: HTMLDivElement;
    let root: Root;
    const writeText = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {writeText},
        });
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        Reflect.deleteProperty(navigator, 'clipboard');
        vi.clearAllMocks();
    });

    it('should copy code without line numbers and keep whitespace', async () => {
        render(
            <MarkdownViewer
                html={
                    '<div class="yfm-code-floating-container"><pre><code><span class="yfm-line-number">1</span><span class="yfm-line">  <span class="hljs-keyword">const</span> a = 1;</span>\n<span class="yfm-line-number">2</span><span class="yfm-line">  a++;</span>\n</code></pre></div>'
                }
            >
                <YfmCodeBlockActions />
            </MarkdownViewer>,
        );

        const copy = getButton();
        await act(async () => copy.click());

        expect(writeText).toHaveBeenCalledWith('  const a = 1;\n  a++;\n');
    });

    it('should keep text wrapping when the button is disabled', () => {
        const html = '<div class="yfm-clipboard"><pre><code>Long line</code></pre></div>';
        const update = (lineWrappingButton?: boolean) =>
            render(
                <MarkdownViewer html={html}>
                    <YfmCodeBlockActions
                        copyButton={false}
                        lineWrappingButton={lineWrappingButton}
                    />
                </MarkdownViewer>,
            );
        update();
        const code = container.querySelector('code');
        const wrap = getButton('Text wrapping');
        assert(code);
        expect(wrap.getAttribute('aria-pressed')).toBe('false');

        act(() => wrap.click());
        expect(code.classList.contains('wrap')).toBe(true);

        update(false);
        expect(code.classList.contains('wrap')).toBe(true);
        expect(container.querySelector('button')).toBeNull();

        update();
        expect(getButton('Text wrapping').getAttribute('aria-pressed')).toBe('true');
    });

    it('should remove actions without resetting text wrapping', () => {
        const html =
            '<div class="yfm-clipboard"><pre><code class="wrap">Code</code></pre><button class="yfm-clipboard-button">Built-in copy</button></div>';
        render(
            <MarkdownViewer html={html}>
                <YfmCodeBlockActions />
            </MarkdownViewer>,
        );
        const host = container.querySelector('.yfm-clipboard');
        const wrap = getButton('Text wrapping');
        assert(host);
        expect(wrap.getAttribute('aria-pressed')).toBe('true');
        act(() => wrap.click());

        render(<MarkdownViewer html={html} />);

        expect(container.querySelector('code')?.classList.contains('wrap')).toBe(false);
        expect(host.classList.contains('g-md-yfm-code-block')).toBe(false);
        expect(container.querySelectorAll('button')).toHaveLength(1);
        expect(container.querySelector('button')?.textContent).toBe('Built-in copy');
    });

    it('should use a custom selector and the current text extractor', async () => {
        const html =
            '<section data-code="first"><pre><code>First</code></pre></section><section data-code="second"><pre><code>Second</code></pre></section>';
        const update = (selector: string, prefix: string) =>
            render(
                <MarkdownViewer html={html}>
                    <YfmCodeBlockActions
                        codeBlockSelector={selector}
                        getCodeBlockText={(element) => prefix + element.dataset.code}
                    />
                </MarkdownViewer>,
            );
        update('[data-code="first"]', 'old: ');
        update('[data-code="first"]', 'current: ');
        const first = getButton();
        await act(async () => first.click());
        expect(writeText).toHaveBeenLastCalledWith('current: first');

        update('[data-code="second"]', 'new: ');
        expect(container.querySelector('[data-code="first"] button')).toBeNull();
        const second = getButton();
        await act(async () => second.click());
        expect(writeText).toHaveBeenLastCalledWith('new: second');
    });

    it('should attach actions to new HTML without duplicates in StrictMode', async () => {
        const update = (text: string) =>
            render(
                <StrictMode>
                    <MarkdownViewer
                        html={`<div class="yfm-code-floating-container"><pre><code>${text}</code></pre></div>`}
                    >
                        <YfmCodeBlockActions />
                    </MarkdownViewer>
                </StrictMode>,
            );
        update('First');
        const oldHost = container.querySelector('.yfm-code-floating-container');
        assert(oldHost);
        update('Second');
        update('Third');

        expect(oldHost.querySelector('button')).toBeNull();
        expect(container.querySelectorAll('button')).toHaveLength(2);
        const copy = getButton();
        await act(async () => copy.click());
        expect(writeText).toHaveBeenCalledWith('Third');
    });

    it('should isolate actions and use the language of each viewer', async () => {
        render(
            <>
                <ThemeProvider lang="en">
                    <MarkdownViewer html='<div class="yfm-clipboard"><pre><code>English</code></pre></div>'>
                        <YfmCodeBlockActions />
                    </MarkdownViewer>
                </ThemeProvider>
                <ThemeProvider lang="ru">
                    <MarkdownViewer html='<div class="yfm-clipboard"><pre><code>Русский</code></pre></div>'>
                        <YfmCodeBlockActions />
                    </MarkdownViewer>
                </ThemeProvider>
            </>,
        );
        const wrap = getButton('Перенос текста');
        const copy = getButton();
        act(() => wrap.click());
        await act(async () => copy.click());

        expect(writeText).toHaveBeenCalledWith('English');
        expect(container.querySelectorAll('code.wrap')).toHaveLength(1);
        expect(container.querySelector('code.wrap')?.textContent).toBe('Русский');
    });

    it('should keep other React slots and skip code blocks inside them', () => {
        const update = (showActions: boolean) =>
            render(
                <MarkdownViewer html='<div class="yfm-clipboard"><pre><code>Code</code></pre></div>'>
                    <ViewerTargets selector=".yfm-clipboard" as="div">
                        {() => (
                            <div className="yfm-clipboard">
                                <pre>
                                    <code>React content</code>
                                </pre>
                                <button>Custom action</button>
                            </div>
                        )}
                    </ViewerTargets>
                    {showActions && <YfmCodeBlockActions />}
                </MarkdownViewer>,
            );
        update(false);
        update(true);
        expect(container.querySelectorAll('button')).toHaveLength(3);
        update(false);
        expect(container.querySelectorAll('button')).toHaveLength(1);
        expect(container.querySelector('button')?.textContent).toBe('Custom action');
    });

    function render(children: ReactNode) {
        act(() => root.render(children));
    }

    function getButton(label = 'Copy') {
        const button = container.querySelector(`button[aria-label="${label}"]`);
        assert(button instanceof HTMLButtonElement);
        return button;
    }
});
