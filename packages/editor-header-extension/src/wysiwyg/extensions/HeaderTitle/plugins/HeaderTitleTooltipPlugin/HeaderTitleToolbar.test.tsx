// @vitest-environment jsdom
import {ToolbarDataType} from '@gravity-ui/markdown-editor';
import {SelectionContext} from '@gravity-ui/markdown-editor/extensions';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    headerTitle,
    headerTitleClassName,
    headerTitleColors,
    headerTitleSizes,
} from '@gravity-ui/markdown-plugin-header';
import {act} from 'react-dom/test-utils';
import {beforeEach, describe, expect, it} from 'vitest';

import {createTestEditor, header, press, setCursor, textPos} from '../../../../../../tests/editor';
import {createEditorWithRenderer, createToolbarRoot, settle} from '../../../../../../tests/toolbar';

import {HeaderTitleToolbar} from './HeaderTitleToolbar';

const {createView, markup} = createTestEditor();

const TITLE_POS = 1;
const SIZE_NAMES = headerTitleSizes.map((size) => `Heading ${size}`);
const COLOR_NAMES = ['Default', 'Gray', 'Yellow', 'Orange', 'Red', 'Green', 'Blue', 'Violet'];

describe('Header title toolbar', () => {
    let view: EditorView;
    const {mount, render, button, labels, open, choose} = createToolbarRoot(() => (
        <HeaderTitleToolbar
            view={view}
            pos={TITLE_POS}
            {...headerTitle(view.state.doc.nodeAt(TITLE_POS)?.attrs ?? {})}
        />
    ));

    beforeEach(async () => {
        view = createView(header('::header-title[Team portal]{size="3" color="red"}'));
        await mount();
    });

    it.each([
        [{size: 3, color: 'red'}, ['Title size: Heading 3', 'Title color: Red']],
        [{size: 1, color: 'auto'}, ['Title size: Heading 1', 'Title color: Default']],
        [{size: 6, color: 'violet'}, ['Title size: Heading 6', 'Title color: Violet']],
    ])('should name the buttons with the current values of %j', async (attrs, names) => {
        view.dispatch(
            view.state.tr
                .setNodeAttribute(TITLE_POS, 'size', attrs.size)
                .setNodeAttribute(TITLE_POS, 'color', attrs.color),
        );
        await render();
        expect(labels()).toEqual(names);
    });

    it.each([
        ['Title size', SIZE_NAMES],
        ['Title color', COLOR_NAMES],
    ])('should list the values of the %s menu', async (menu, names) => {
        const found = await open(menu);
        expect(found.map((element) => element.textContent)).toEqual(names);
    });

    it.each([
        ['Title size', 'Heading 1', '{size="1" color="red"}'],
        ['Title size', 'Heading 2', '{color="red"}'],
        ['Title color', 'Default', '{size="3"}'],
        ['Title color', 'Violet', '{size="3" color="violet"}'],
    ])('should choose %s %j from the menu', async (menu, item, written) => {
        await choose(menu, item);
        expect(markup(view)).toContain(`::header-title[Team portal]${written}\n`);
    });

    it.each(headerTitleColors)('should paint the color button with the %s color', async (color) => {
        view.dispatch(view.state.tr.setNodeAttribute(TITLE_POS, 'color', color));
        await render();
        expect(button('Title color')?.querySelector('svg svg')?.getAttribute('class')).toBe(
            color === 'auto' ? null : `${headerTitleClassName}_color_${color}`,
        );
    });
});

describe('Header title toolbar in the editor', () => {
    const {start} = createEditorWithRenderer();
    const sizeButton = () =>
        document.querySelector<HTMLButtonElement>('[aria-label^="Title size:"]');

    it('should focus the first button of the toolbar on Tab', async () => {
        const view = await start(header('::header-title[Team portal]'));
        await act(async () => setCursor(view, TITLE_POS + 1));
        await settle(sizeButton);
        expect(press(view, 'Tab')).toBe(true);
        expect(document.activeElement).toBe(sizeButton());
    });
});

describe('Selection toolbar over the header title', () => {
    const {start} = createEditorWithRenderer((builder) =>
        builder.use(SelectionContext, {
            config: [
                [
                    {
                        id: 'bold',
                        type: ToolbarDataType.SingleButton,
                        icon: {data: () => null},
                        title: 'Bold',
                        isActive: () => false,
                        isEnable: () => true,
                        exec: () => {},
                    },
                ],
            ],
        }),
    );
    const selectionToolbar = () => document.querySelector('[data-qa="g-md-toolbar-selection"]');

    it.each([
        ['the title', 'Team portal', false],
        ['the description', 'Portal description.', true],
    ])('should show the selection toolbar over %s: %s', async (_name, text, shown) => {
        const view = await start(header('::header-title[Team portal]', 'Portal description.'));
        view.coordsAtPos = () => ({left: 0, right: 0, top: 0, bottom: 0});
        const from = textPos(view, text);
        await act(async () => setCursor(view, from + 1, from + 5));
        await settle();
        expect(Boolean(selectionToolbar())).toBe(shown);
    });
});
