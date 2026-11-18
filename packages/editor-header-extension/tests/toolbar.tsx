import type {ReactElement} from 'react';

import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererComponent} from '@gravity-ui/markdown-editor/extensions';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {Simulate, act} from 'react-dom/test-utils';
import {afterEach, beforeEach, vi} from 'vitest';

import {createTestEditor, headerExtensions, nodePos, press, selectNode} from './editor';

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
    const unmount = () => act(async () => root?.render(null));
    const buttons = () => Array.from(container?.querySelectorAll('button') ?? []);
    const button = (name: string) =>
        buttons().find((element) => element.getAttribute('aria-label')?.startsWith(`${name}:`));
    const labels = () => buttons().map((element) => element.getAttribute('aria-label'));
    const items = () => Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const open = async (name: string) => {
        await act(async () => button(name)?.click());
        return items();
    };
    const choose = async (name: string, item: string, key?: string) => {
        const found = (await open(name)).find((element) => element.textContent === item);
        await act(async () => {
            if (key) {
                found?.focus();
                found?.dispatchEvent(
                    new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true}),
                );
            } else {
                found?.click();
            }
        });
        await render();
    };

    return {mount, render, unmount, buttons, button, labels, items, open, choose};
}

export const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');

export const settingsWindow = (qa: string) =>
    document.querySelector<HTMLElement>(`[role="dialog"][data-qa="${qa}"]`);

export const switchState = (container: HTMLElement | null | undefined, label: string) => {
    const element = Array.from(container?.querySelectorAll('label') ?? []).find(
        (found) => found.textContent === label,
    );
    const control = element && document.getElementById(element.htmlFor);
    return control instanceof HTMLInputElement
        ? {checked: control.checked, disabled: control.disabled, control}
        : undefined;
};

const isMac = /Mac|iP(hone|[oa]d)/.test(navigator.platform);

export const pressHistoryKey = async (
    target: Element | null | undefined,
    key: string,
    shiftKey = false,
) => {
    const event = new KeyboardEvent('keydown', {
        key,
        shiftKey,
        metaKey: isMac,
        ctrlKey: !isMac,
        bubbles: true,
        cancelable: true,
    });
    await act(async () => {
        target?.dispatchEvent(event);
    });
    return event;
};

export const focusInDialog = () => Boolean(dialog()?.contains(document.activeElement));

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

export const dialogButton = (name: string) =>
    Array.from(dialog()?.querySelectorAll('button') ?? []).find(
        (element) => (element.getAttribute('aria-label') ?? element.textContent) === name,
    );

export const dialogInputs = () =>
    Array.from(dialog()?.querySelectorAll<HTMLInputElement>('input:not([type="file"])') ?? []);

export const typeText = async (input: HTMLInputElement | null | undefined, value: string) => {
    if (!input) throw new Error('The field is not rendered');
    await act(async () => {
        input.focus();
        Simulate.change(input, {target: {value}} as never);
    });
    return input;
};

export const keyDown = async (input: HTMLElement | null | undefined, key: string) => {
    if (!input) throw new Error('The field is not rendered');
    await act(async () => {
        Simulate.keyDown(input, {key});
    });
    await settle();
};

export const pressKey = async (
    target: Element | null | undefined,
    key: string,
    init: KeyboardEventInit = {},
) => {
    const event = new KeyboardEvent('keydown', {...init, key, bubbles: true, cancelable: true});
    await act(async () => {
        if (target instanceof HTMLElement) target.focus();
        target?.dispatchEvent(event);
    });
    await settle();
    const focused = document.activeElement;
    if (key === 'Enter' && !event.defaultPrevented && focused instanceof HTMLButtonElement) {
        await act(async () => focused.click());
        await settle();
    }
    return event;
};

export const typeAndCommit = async (
    input: HTMLInputElement | null | undefined,
    value: string,
    key?: string,
) => {
    const field = await typeText(input, value);
    if (key) await keyDown(field, key);
    else await act(async () => Simulate.blur(field));
};

export const openNodeSettings = async (editor: EditorView, name: string) => {
    await act(async () => selectNode(editor, nodePos(editor, name)));
    await act(async () => {
        press(editor, 'Enter');
    });
    await settle(focusInDialog);
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
