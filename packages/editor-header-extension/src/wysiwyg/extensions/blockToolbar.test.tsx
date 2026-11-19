// @vitest-environment jsdom
import {Heading1, Heading2, Heading3} from '@gravity-ui/icons';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {createTestEditor, header, press, setCursor, textPos} from '../../../tests/editor';
import {title} from '../../../tests/title';
import {
    createEditorWithRenderer,
    createReactRoot,
    menuItems,
    pressKey,
    settle,
    toolbarButton,
} from '../../../tests/toolbar';

import {BlockToolbar, optionsButton} from './blockToolbar';

const options = [Heading1, Heading2, Heading3].map((icon, index) => ({
    value: index + 1,
    icon: {data: icon},
    title: () => `Heading ${index + 1}`,
}));

describe('Block toolbar', () => {
    const {createView} = createTestEditor();
    const {render, unmount} = createReactRoot();
    const onSelect = vi.fn();
    let view: EditorView;
    let place: HTMLElement;

    const mount = (current = 2) =>
        render(
            <BlockToolbar
                view={view}
                qa="g-md-toolbar-test"
                data={[
                    [
                        optionsButton({
                            id: 'test-size',
                            title: (value) => `Size: ${value}`,
                            options,
                            current,
                            onSelect,
                        }),
                        optionsButton({
                            id: 'test-weight',
                            title: (value) => `Weight: ${value}`,
                            options,
                            current,
                            onSelect,
                        }),
                    ],
                ]}
            />,
        );

    beforeEach(async () => {
        place = document.createElement('div');
        document.body.append(place);
        view = createView(header(title), place);
        onSelect.mockReset();
        await mount();
    });

    afterEach(() => {
        place.remove();
    });

    it.each([1, 3])('should show the icon of the current option %s on the button', async (size) => {
        await mount(size);
        const icon = toolbarButton('Size')?.querySelector('svg svg')?.outerHTML;
        await act(async () => toolbarButton('Size')?.click());
        const item = menuItems().find((element) => element.textContent === `Heading ${size}`);
        expect(icon).toBeDefined();
        expect(icon).toBe(item?.querySelector('svg svg')?.outerHTML);
    });

    it.each([
        ['ArrowRight', 'Size', 'Weight'],
        ['ArrowRight', 'Weight', 'Size'],
        ['ArrowLeft', 'Size', 'Weight'],
        ['ArrowLeft', 'Weight', 'Size'],
    ])('should move the focus on %s from the %s button to the %s button', async (key, from, to) => {
        const event = await pressKey(toolbarButton(from), key);
        expect(event.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(toolbarButton(to));
    });

    it.each([
        ['ArrowDown', 'Heading 1', 'Heading 2'],
        ['ArrowDown', 'Heading 3', 'Heading 1'],
        ['ArrowUp', 'Heading 2', 'Heading 1'],
        ['ArrowUp', 'Heading 1', 'Heading 3'],
    ])('should move the focus in the menu on %s from %s to %s', async (key, from, to) => {
        await act(async () => toolbarButton('Size')?.click());
        const item = (name: string) => menuItems().find((element) => element.textContent === name);
        await pressKey(item(from), key);
        expect(document.activeElement).toBe(item(to));
    });

    it.each([
        ['Enter', 'Heading 3', 3],
        [' ', 'Heading 1', 1],
    ])('should choose an option with %j', async (key, name, value) => {
        await act(async () => toolbarButton('Size')?.click());
        await pressKey(
            menuItems().find((element) => element.textContent === name),
            key,
        );
        expect(onSelect.mock.calls).toEqual([[value]]);
    });

    it.each([
        ['Tab', 'Weight', {}],
        ['Shift+Tab', 'Size', {shiftKey: true}],
    ])(
        'should return the focus to the editor on %s from the %s button',
        async (_name, from, init) => {
            const focus = vi.spyOn(view, 'focus');
            const event = await pressKey(toolbarButton(from), 'Tab', init);
            expect(event.defaultPrevented).toBe(true);
            expect(focus).toHaveBeenCalledTimes(1);
        },
    );

    it('should keep Tab between the buttons inside the toolbar', async () => {
        const event = await pressKey(toolbarButton('Size'), 'Tab');
        expect(event.defaultPrevented).toBe(false);
    });

    it.each([
        ['with the focus inside', true],
        ['without the focus inside', false],
    ])(
        'should return the focus to the editor when the toolbar closes %s',
        async (_name, inside) => {
            const focus = vi.spyOn(view, 'focus');
            if (inside) await act(async () => toolbarButton('Size')?.focus());
            await unmount();
            expect(focus).toHaveBeenCalledTimes(inside ? 1 : 0);
        },
    );
});

describe('Header title toolbar with the keyboard', () => {
    const {start, markup} = createEditorWithRenderer();
    const source = header('::header-title[Team portal]', 'Text');
    const toolbar = () => document.querySelector('[data-qa="g-md-toolbar-header-title"]');
    const item = (name: string) => menuItems().find((element) => element.textContent === name);

    const startInTitle = async () => {
        const view = await start(source);
        await act(async () => setCursor(view, textPos(view, 'Team portal') + 4));
        await settle(() => toolbarButton('Title size'));
        return view;
    };

    /** A browser presses a focused button on Enter. */
    const pressButton = async (button: HTMLElement | null | undefined) => {
        await pressKey(button, 'Enter');
        await act(async () => button?.click());
    };

    it('should enter the toolbar on Tab and move between the buttons with arrows', async () => {
        const view = await startInTitle();
        await act(async () => {
            expect(press(view, 'Tab')).toBe(true);
        });
        expect(document.activeElement).toBe(toolbarButton('Title size'));
        await pressKey(toolbarButton('Title size'), 'ArrowRight');
        expect(document.activeElement).toBe(toolbarButton('Title color'));
        await pressKey(toolbarButton('Title color'), 'ArrowLeft');
        expect(document.activeElement).toBe(toolbarButton('Title size'));
    });

    it.each([
        ['Title size', 'ArrowDown', 1, 'Heading 3', '{size="3"}'],
        ['Title color', 'ArrowUp', 1, 'Violet', '{color="violet"}'],
    ])(
        'should choose a value of the %s menu with %s and Enter and return the focus to the editor',
        async (name, key, times, chosen, written) => {
            const view = await startInTitle();
            await pressButton(toolbarButton(name));
            await settle(() => menuItems().length);
            const current = menuItems().find((element) =>
                element.classList.contains('g-menu__item_active'),
            );
            await act(async () => current?.focus());
            for (let i = 0; i < times; i++) {
                await pressKey(document.activeElement as HTMLElement, key);
            }
            expect(document.activeElement).toBe(item(chosen));
            await pressKey(item(chosen), 'Enter');
            await settle(() => !menuItems().length);
            expect(markup(view)).toBe(header(`::header-title[Team portal]${written}`, 'Text'));
            expect(document.activeElement).toBe(view.dom);
            expect(view.state.selection.from).toBe(textPos(view, 'Team portal') + 4);
        },
    );

    it('should close the menu on Escape, then hide the toolbar and return the focus', async () => {
        const view = await startInTitle();
        const button = toolbarButton('Title size');
        await pressButton(button);
        await settle(() => menuItems().length);
        await pressKey(button, 'Escape');
        await settle(() => !menuItems().length);
        expect(document.activeElement).toBe(button);
        expect(toolbar()).not.toBeNull();
        await pressKey(button, 'Escape');
        await settle(() => !toolbar());
        expect(document.activeElement).toBe(view.dom);
        expect(markup(view)).toBe(source);
    });
});
