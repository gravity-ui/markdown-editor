import type {ReactElement} from 'react';

import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererComponent} from '@gravity-ui/markdown-editor/extensions';
import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, vi} from 'vitest';

import type {HeaderOptions} from '../src/wysiwyg/extensions/Header';

import {createTestEditor, headerExtensions} from './editor';

const SETTLE_TIMEOUT = 2000;

const emptyRects = (): DOMRectList =>
    Object.assign([], {item: () => null}) as unknown as DOMRectList;

// jsdom has no layout: ProseMirror measures ranges when it scrolls to the selection.
if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = emptyRects;
    Range.prototype.getBoundingClientRect = () => new DOMRect();
}

export const settle = async (until: () => unknown = () => true) => {
    const end = Date.now() + SETTLE_TIMEOUT;
    for (;;) {
        await act(async () => {
            await new Promise((done) => setTimeout(done, 0));
        });
        if (until()) return;
        if (Date.now() > end) throw new Error(`The condition is not met: ${until}`);
    }
};

/** A React root mounted for each test, with the uikit theme. */
export function createReactRoot() {
    let container: HTMLElement;
    let root: Root | undefined;

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        vi.stubGlobal(
            'ResizeObserver',
            class {
                observe() {}
                unobserve() {}
                disconnect() {}
            },
        );
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    const unmount = async () => {
        const mounted = root;
        root = undefined;
        if (mounted) await act(async () => mounted.unmount());
    };

    afterEach(async () => {
        await unmount();
        container.remove();
        vi.unstubAllGlobals();
    });

    const render = (element: ReactElement) =>
        act(async () => {
            root?.render(<ThemeProvider theme="light">{element}</ThemeProvider>);
        });

    return {render, unmount};
}

export function createEditorWithRenderer(extra?: ExtensionAuto, options?: HeaderOptions) {
    const storage = new ReactRenderStorage();
    const editor = createTestEditor(headerExtensions(extra, storage, options));
    const {render} = createReactRoot();
    let place: HTMLElement;

    beforeEach(() => {
        place = document.createElement('div');
        document.body.append(place);
    });

    afterEach(() => {
        place.remove();
    });

    const start = async (source: string) => {
        const view = editor.createView(source, place);
        await render(<ReactRendererComponent storage={storage} />);
        view.focus();
        return view;
    };

    return {...editor, start};
}

export const byQa = (qa: string) => document.querySelector<HTMLElement>(`[data-qa="${qa}"]`);

/** Focuses the target and dispatches a keydown on it; returns the event. */
export const pressKey = async (
    target: HTMLElement | null | undefined,
    key: string,
    init: KeyboardEventInit = {},
) => {
    const event = new KeyboardEvent('keydown', {...init, key, bubbles: true, cancelable: true});
    await act(async () => {
        target?.focus();
        target?.dispatchEvent(event);
    });
    return event;
};

/** A toolbar button by the start of its accessible name, such as `Title size`. */
export const toolbarButton = (name: string) =>
    Array.from(document.querySelectorAll('button')).find((element) =>
        element.getAttribute('aria-label')?.startsWith(`${name}:`),
    );

export const menuItems = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
