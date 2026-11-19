// @vitest-environment jsdom
import {undo} from '@gravity-ui/markdown-editor/pm/history';
import {
    headerAligns,
    headerLayoutDefaults,
    headerVerticals,
} from '@gravity-ui/markdown-plugin-header';
import {act} from 'react-dom/test-utils';
import {describe, expect, it} from 'vitest';

import {createTestEditor, setCursor} from '../../../../tests/editor';
import {byQa, createEditorWithRenderer, settle} from '../../../../tests/toolbar';
import {runCommand} from '../commands';

import {type RemovedParts, setHeaderLayout, toggleHeaderPart} from './commands';
import {headerParts} from './parts';
import {headerMarkup} from './utils';

const image = '::header-image{src="/team.png" alt="Team"}';
const title = '::header-title[Team portal]';
const description = ':::header-content\n\nPortal description.\n\n:::';

const banner = (attrs: string, ...blocks: string[]) =>
    [`:::header{height="s" width="m"${attrs}}`, ...blocks, ':::'].join('\n\n');

const layoutAttrs = (align: string, vertical: string) =>
    (align === headerLayoutDefaults.align ? '' : ` align="${align}"`) +
    (vertical === headerLayoutDefaults.vertical ? '' : ` vertical="${vertical}"`);

const combinations = headerAligns.flatMap((align) =>
    headerVerticals.map((vertical) => ({align, vertical})),
);

describe('Header layout', () => {
    const {createView, markup, markupParser} = createTestEditor();

    it.each(combinations)(
        'should keep align $align and vertical $vertical through the visual editor',
        ({align, vertical}) => {
            const source = banner(layoutAttrs(align, vertical), image, title, description);
            const doc = markupParser.parse(source);
            expect(doc.firstChild?.attrs).toMatchObject({align, vertical});
            expect(markup(createView(source))).toBe(source);
        },
    );

    it.each(['align="justify"', 'vertical="middle"', 'align="left" vertical="center"'])(
        'should not write a default or unsupported layout value from %s',
        (attrs) => {
            const editor = createView(`:::header{${attrs}}\n\nText\n\n:::`);
            expect(editor.state.doc.firstChild?.attrs).toMatchObject(headerLayoutDefaults);
            expect(markup(editor)).toBe(banner('', 'Text'));
        },
    );

    it.each([
        {name: 'description → image → title', blocks: [description, image, title]},
        {name: 'title → text → image', blocks: [title, 'Text', image]},
        {name: 'image last', blocks: [title, description, image]},
    ])('should keep the source order $name in both modes', ({blocks}) => {
        const source = banner(' align="right"', ...blocks);
        expect(markup(createView(source))).toBe(source);
    });

    it('should change the layout in separate undo steps and copy it with the banner', () => {
        const editor = createView(banner('', title));
        expect(runCommand(editor, setHeaderLayout(0, 'align', 'center'))).toBe(true);
        expect(runCommand(editor, setHeaderLayout(0, 'vertical', 'bottom'))).toBe(true);
        expect(markup(editor)).toBe(banner(' align="center" vertical="bottom"', title));
        const {serializer} = createTestEditor();
        expect(headerMarkup(serializer, editor.state, 0)).toBe(
            banner(' align="center" vertical="bottom"', title),
        );
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(banner(' align="center"', title));
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(banner('', title));
        expect(runCommand(editor, setHeaderLayout(1, 'align', 'right'))).toBe(false);
    });

    it('should switch parts on in the order image → title → description', () => {
        const editor = createView(banner(' align="right"', 'Text', 'More'));
        const removed: RemovedParts = new Map();
        for (const part of ['content', 'title', 'image'] as const) {
            expect(runCommand(editor, toggleHeaderPart(0, part, true, removed))).toBe(true);
        }
        expect(markup(editor)).toBe(
            banner(
                ' align="right"',
                '::header-image',
                '::header-title[This is your start page]',
                ':::header-content\n\nHere you will find the main rules and recommendations for working in our services\n\n:::',
                'Text',
                'More',
            ),
        );
    });

    it('should restore parts into a banner with a custom order next to their neighbours', () => {
        const source = banner('', description, image, title);
        const editor = createView(source);
        const removed: RemovedParts = new Map();
        for (const part of ['image', 'title', 'content'] as const) {
            runCommand(editor, toggleHeaderPart(0, part, false, removed));
        }
        expect(headerParts(editor.state.doc.child(0))).toEqual({
            image: false,
            title: false,
            content: false,
        });
        runCommand(editor, toggleHeaderPart(0, 'content', true, removed));
        runCommand(editor, toggleHeaderPart(0, 'image', true, removed));
        runCommand(editor, toggleHeaderPart(0, 'title', true, removed));
        expect(markup(editor)).toBe(banner('', image, title, description));
    });

    it('should render the layout modifiers in the editor block', () => {
        const editor = createView(banner(' align="right" vertical="bottom"', title));
        const dom = editor.nodeDOM(0) as HTMLElement;
        expect(dom.classList).toContain('g-md-header-plugin_align_right');
        expect(dom.classList).toContain('g-md-header-plugin_vertical_bottom');
        runCommand(editor, setHeaderLayout(0, 'align', 'left'));
        expect(dom.classList).not.toContain('g-md-header-plugin_align_right');
        expect(dom.hasAttribute('data-align')).toBe(false);
        expect(dom.getAttribute('data-vertical')).toBe('bottom');
    });
});

describe('Header layout settings', () => {
    const {start, markup} = createEditorWithRenderer();

    const radio = (label: string) =>
        document.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
    const settingsButton = () =>
        Array.from(document.querySelectorAll('button')).find((button) =>
            button.getAttribute('aria-label')?.startsWith('Settings'),
        );

    it('should show the layout of the banner and change it', async () => {
        const editor = await start(banner(' vertical="top"', 'Text'));
        setCursor(editor, 2);
        await settle(settingsButton);
        await act(async () => settingsButton()?.click());
        await settle(() => byQa('header-settings'));
        expect(radio('Top')?.checked).toBe(true);
        expect(radio('Left')?.checked).toBe(true);
        await act(async () => radio('Right')?.click());
        expect(markup(editor)).toBe(banner(' align="right" vertical="top"', 'Text'));
        await act(async () => radio('Bottom')?.click());
        expect(markup(editor)).toBe(banner(' align="right" vertical="bottom"', 'Text'));
        await settle(() => radio('Bottom')?.checked);
        expect(radio('Right')?.checked).toBe(true);
    });
});
