// @vitest-environment jsdom
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    headerTitleClassName,
    headerTitleColors,
    headerTitleModel,
    headerTitleSizes,
} from '@gravity-ui/markdown-plugin-header';
import {act} from 'react-dom/test-utils';
import {beforeEach, describe, expect, it} from 'vitest';

import {createTestEditor, header, setCursor, textPos} from '../../../../../../tests/editor';
import {
    createEditorWithRenderer,
    createReactRoot,
    menuItems,
    settle,
    toolbarButton,
} from '../../../../../../tests/toolbar';
import {runCommand} from '../../../commands';
import {setHeaderTitleAttrs} from '../../commands';

import {HeaderTitleToolbar} from './HeaderTitleToolbar';

const {createView, markup} = createTestEditor();

const TITLE_POS = 1;
const SIZE_NAMES = headerTitleSizes.map((size) => `Heading ${size}`);
const COLOR_NAMES = ['Default', 'Gray', 'Yellow', 'Orange', 'Red', 'Green', 'Blue', 'Violet'];

describe('Header title commands of the toolbar', () => {
    it.each(
        headerTitleSizes.map((size) => ({
            size,
            written: size === 2 ? '{color="red"}' : `{size="${size}" color="red"}`,
        })),
    )('should set the size $size', ({size, written}) => {
        const editor = createView(header('::header-title[Team portal]{size="4" color="red"}'));
        expect(runCommand(editor, setHeaderTitleAttrs(TITLE_POS, {size}))).toBe(true);
        expect(markup(editor)).toBe(header(`::header-title[Team portal]${written}`));
    });

    it.each(
        headerTitleColors.map((color) => ({
            color,
            written: color === 'auto' ? '{size="3"}' : `{size="3" color="${color}"}`,
        })),
    )('should set the color $color', ({color, written}) => {
        const editor = createView(header('::header-title[Team portal]{size="3" color="gray"}'));
        expect(runCommand(editor, setHeaderTitleAttrs(TITLE_POS, {color}))).toBe(true);
        expect(markup(editor)).toBe(header(`::header-title[Team portal]${written}`));
    });

    it.each<[Record<string, unknown>, string]>([
        [{size: 7}, '{color="red"}'],
        [{color: 'pink'}, '{size="3"}'],
        [{size: '1', color: 'blue'}, '{size="1" color="blue"}'],
    ])('should normalize the attributes %j', (attrs, written) => {
        const editor = createView(header('::header-title[Team portal]{size="3" color="red"}'));
        runCommand(editor, setHeaderTitleAttrs(TITLE_POS, attrs));
        expect(markup(editor)).toBe(header(`::header-title[Team portal]${written}`));
    });

    it('should leave a node of another type unchanged', () => {
        const editor = createView(header('Text'));
        expect(runCommand(editor, setHeaderTitleAttrs(TITLE_POS, {size: 1}))).toBe(false);
    });

    it('should keep the text and the cursor', () => {
        const editor = createView(header('::header-title[Team portal]', 'Text'));
        setCursor(editor, TITLE_POS + 5);
        runCommand(editor, setHeaderTitleAttrs(TITLE_POS, {size: 1, color: 'green'}));
        expect(editor.state.selection.from).toBe(TITLE_POS + 5);
        expect(editor.state.doc.nodeAt(TITLE_POS)?.textContent).toBe('Team portal');
    });
});

describe('Header title toolbar', () => {
    let view: EditorView;
    const {render} = createReactRoot();
    const mount = () =>
        render(
            <HeaderTitleToolbar
                view={view}
                pos={TITLE_POS}
                {...headerTitleModel(view.state.doc.nodeAt(TITLE_POS)?.attrs ?? {})}
            />,
        );
    const labels = () =>
        Array.from(document.querySelectorAll('button')).map((element) =>
            element.getAttribute('aria-label'),
        );
    const open = async (name: string) => {
        await act(async () => toolbarButton(name)?.click());
        return menuItems();
    };
    const choose = async (name: string, item: string) => {
        const found = (await open(name)).find((element) => element.textContent === item);
        await act(async () => found?.click());
        await mount();
    };

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
        await mount();
        expect(labels()).toEqual(names);
    });

    it.each([
        ['Title size', SIZE_NAMES, 'Heading 3'],
        ['Title color', COLOR_NAMES, 'Red'],
    ])(
        'should list the values of the %s menu and mark the current one',
        async (menu, names, active) => {
            const found = await open(menu);
            expect(found.map((element) => element.textContent)).toEqual(names);
            expect(
                found
                    .filter((element) => element.classList.contains('g-menu__item_active'))
                    .map((element) => element.textContent),
            ).toEqual([active]);
        },
    );

    it.each([
        ['Title size', 'Heading 1', '{size="1" color="red"}'],
        ['Title size', 'Heading 2', '{color="red"}'],
        ['Title color', 'Default', '{size="3"}'],
        ['Title color', 'Violet', '{size="3" color="violet"}'],
    ])('should choose %s %j with the mouse', async (menu, item, written) => {
        await choose(menu, item);
        expect(markup(view)).toBe(header(`::header-title[Team portal]${written}`));
    });

    it.each(headerTitleColors)('should paint the color button with the %s color', async (color) => {
        view.dispatch(view.state.tr.setNodeAttribute(TITLE_POS, 'color', color));
        await mount();
        expect(toolbarButton('Title color')?.querySelector('svg svg')?.getAttribute('class')).toBe(
            color === 'auto' ? null : `${headerTitleClassName}_color_${color}`,
        );
    });
});

describe('Header title toolbar in the editor', () => {
    const {start} = createEditorWithRenderer();

    it('should show the toolbar for a cursor in the title only', async () => {
        const view = await start(header('::header-title[Team portal]', 'Text'));
        await act(async () => setCursor(view, textPos(view, 'Team portal') + 1));
        await settle(() => toolbarButton('Title size'));
        await act(async () => setCursor(view, textPos(view, 'Text') + 1));
        await settle(() => !toolbarButton('Title size'));
        expect(toolbarButton('Title color')).toBeUndefined();
    });
});
