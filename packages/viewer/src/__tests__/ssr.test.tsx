// @vitest-environment node
import {renderToString} from 'react-dom/server';
import {afterEach, expect, it, vi} from 'vitest';

import {MarkdownViewer, ViewerTargets, useViewerEffect} from '../index';

afterEach(() => {
    vi.restoreAllMocks();
});

it('should render prepared HTML and children on the server without DOM or effect setup', () => {
    const setup = vi.fn();
    function Extension() {
        useViewerEffect(setup, []);
        return <span>Overlay</span>;
    }
    const consoleError = vi.spyOn(console, 'error');
    expect(typeof document).toBe('undefined');
    const html = renderToString(
        <MarkdownViewer html="<p>Server HTML</p>" qa="document">
            <Extension />
        </MarkdownViewer>,
    );
    expect(html).toContain('<p>Server HTML</p>');
    expect(html).toContain('<span>Overlay</span>');
    expect(html).toContain('data-qa="document"');
    expect(setup).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
});

it('should render prepared hosts without accessing the DOM or rendering portals on the server', () => {
    const children = vi.fn(() => <button>Action</button>);
    const html = renderToString(
        <MarkdownViewer html='<h2 id="title">Title</h2>'>
            <ViewerTargets selector="h2[id]">{children}</ViewerTargets>
        </MarkdownViewer>,
    );
    expect(html).toContain('<h2 id="title">Title</h2>');
    expect(html).not.toContain('data-markdown-viewer-slot');
    expect(children).not.toHaveBeenCalled();
});

it('should reject ViewerTargets outside MarkdownViewer', () => {
    expect(() => renderToString(<ViewerTargets selector="h2">{() => null}</ViewerTargets>)).toThrow(
        'inside MarkdownViewer',
    );
});
