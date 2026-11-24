// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {EditorState} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {BaseSchemaSpecs} from '@gravity-ui/markdown-editor/specs';
import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {BannerSpecs} from '../../../Banner/BannerSpecs';

import {BannerTitleToolbar} from './BannerTitleToolbar';

const {schema, markupParser} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(BannerSpecs),
}).buildDeps();

describe('Banner title toolbar', () => {
    let container: HTMLDivElement;
    let root: Root;
    let view: EditorView;

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        const editor = document.createElement('div');
        document.body.append(editor);
        view = new EditorView(editor, {
            state: EditorState.create({
                schema,
                doc: markupParser.parse(':::banner\n::banner-title[Title]\n:::'),
            }),
            dispatchTransaction: (tr) => {
                view.updateState(view.state.apply(tr));
                render();
            },
        });
        render();
    });

    afterEach(() => {
        act(() => root.unmount());
        view.dom.remove();
        view.destroy();
        container.remove();
        vi.unstubAllGlobals();
    });

    function render() {
        const title = view.state.doc.nodeAt(1);
        act(() => {
            root.render(
                <ThemeProvider>
                    <BannerTitleToolbar
                        view={view}
                        pos={1}
                        size={title?.attrs.size}
                        color={title?.attrs.color}
                    />
                </ThemeProvider>,
            );
        });
    }

    const attrs = () => view.state.doc.nodeAt(1)?.attrs;
    const buttons = () => Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
    const menu = () => document.querySelector<HTMLElement>('[role="menu"]');
    const items = () =>
        Array.from(menu()?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

    function press(target: Element | null, key: string) {
        act(() => {
            target?.dispatchEvent(
                new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true}),
            );
        });
    }

    const click = (target: HTMLElement | undefined) => act(() => target?.click());

    const closed = () => expect.poll(menu).toBeNull();
    const item = (label: string) => items().find((element) => element.ariaLabel === label);
    const active = () => items().find((element) => element.className.includes('_active'));

    it('should choose a size with the mouse', async () => {
        click(buttons()[0]);
        expect(items()).toHaveLength(6);
        expect(active()?.ariaLabel).toBe('Heading 2');
        click(item('Heading 4'));
        expect(attrs()).toEqual({size: 4, color: 'auto'});
        await closed();
    });

    it('should choose a color with the mouse', () => {
        click(buttons()[1]);
        expect(active()?.ariaLabel).toBe('Default');
        click(item('Blue'));
        expect(attrs()).toEqual({size: 2, color: 'blue'});
        click(buttons()[1]);
        expect(active()?.ariaLabel).toBe('Blue');
    });

    it('should move between the buttons with the arrows and wrap around', () => {
        const [size, color] = buttons();
        size.focus();
        press(size, 'ArrowRight');
        expect(document.activeElement).toBe(color);
        press(color, 'ArrowRight');
        expect(document.activeElement).toBe(size);
        press(size, 'ArrowLeft');
        expect(document.activeElement).toBe(color);
    });

    it('should move between the menu items with the arrows and choose one with Enter', async () => {
        click(buttons()[0]);
        const [first, , third] = items();
        const last = items()[5];
        first.focus();
        press(first, 'ArrowUp');
        expect(document.activeElement).toBe(last);
        press(last, 'ArrowDown');
        expect(document.activeElement).toBe(first);
        press(first, 'ArrowDown');
        press(document.activeElement, 'ArrowDown');
        expect(document.activeElement).toBe(third);
        press(third, 'Enter');
        expect(attrs()).toEqual({size: 3, color: 'auto'});
        await closed();
        expect(view.hasFocus()).toBe(true);
    });

    it('should close the open menu with Escape and keep the toolbar', async () => {
        click(buttons()[1]);
        items()[0].focus();
        press(items()[0], 'Escape');
        await closed();
        expect(buttons()).toHaveLength(2);
        expect(attrs()).toEqual({size: 2, color: 'auto'});
    });

    it('should return the focus to the editor with Tab after the last button', () => {
        const color = buttons()[1];
        color.focus();
        press(color, 'Tab');
        expect(view.hasFocus()).toBe(true);
    });
});
