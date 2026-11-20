import type {ReactElement} from 'react';

import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererComponent} from '@gravity-ui/markdown-editor/extensions';
import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, vi} from 'vitest';

import {createTestEditor, headerExtensions} from './editor';

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

export function createEditorWithRenderer(extra?: ExtensionAuto) {
    const storage = new ReactRenderStorage();
    const editor = createTestEditor(headerExtensions(extra, storage));
    let place: HTMLElement;
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
        place = document.createElement('div');
        container = document.createElement('div');
        document.body.append(place, container);
        root = createRoot(container);
    });

    afterEach(async () => {
        const mounted = root;
        if (mounted) await act(async () => mounted.unmount());
        root = undefined;
        place.remove();
        container.remove();
        vi.unstubAllGlobals();
    });

    const render = (element: ReactElement) =>
        act(async () => {
            root?.render(<ThemeProvider theme="light">{element}</ThemeProvider>);
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
