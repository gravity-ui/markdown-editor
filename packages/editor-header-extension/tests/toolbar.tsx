import type {ReactElement} from 'react';

import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererComponent} from '@gravity-ui/markdown-editor/extensions';
import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, vi} from 'vitest';

import {createTestEditor, headerExtensions} from './editor';

export function createToolbarRoot(toolbar: () => ReactElement) {
    let container: HTMLDivElement | undefined;
    let root: Root | undefined;

    afterEach(async () => {
        const mounted = root;
        if (mounted) await act(async () => mounted.unmount());
        container?.remove();
        root = undefined;
        container = undefined;
        vi.unstubAllGlobals();
    });

    const render = () =>
        act(async () => {
            root?.render(<ThemeProvider theme="light">{toolbar()}</ThemeProvider>);
        });
    const mount = () => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        return render();
    };
    const buttons = () => Array.from(container?.querySelectorAll('button') ?? []);
    const button = (name: string) =>
        buttons().find((element) => element.getAttribute('aria-label')?.startsWith(`${name}:`));
    const labels = () => buttons().map((element) => element.getAttribute('aria-label'));
    const items = () => Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const open = async (name: string) => {
        await act(async () => button(name)?.click());
        return items();
    };
    const choose = async (name: string, item: string) => {
        const found = (await open(name)).find((element) => element.textContent === item);
        await act(async () => found?.click());
        await render();
    };

    return {mount, render, button, labels, open, choose};
}

const SETTLE_TIMEOUT = 2000;

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

export function createEditorWithRenderer(
    extra?: ExtensionAuto,
    wrap: (renderer: ReactElement) => ReactElement = (renderer) => renderer,
) {
    const storage = new ReactRenderStorage();
    const editor = createTestEditor(headerExtensions(extra, storage));
    const {mount} = createToolbarRoot(() => wrap(<ReactRendererComponent storage={storage} />));
    let place: HTMLElement;

    beforeEach(() => {
        vi.stubGlobal(
            'ResizeObserver',
            class {
                observe() {}
                unobserve() {}
                disconnect() {}
            },
        );
        place = document.createElement('div');
        document.body.append(place);
    });

    afterEach(() => {
        place.remove();
    });

    const start = async (source: string, focus = true) => {
        const view = editor.createView(source, place);
        await mount();
        if (focus) view.focus();
        return view;
    };

    return {...editor, start};
}
