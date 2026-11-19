// @vitest-environment jsdom
import {BlockquoteSpecs, BoldSpecs} from '@gravity-ui/markdown-editor/specs';
import {act} from 'react-dom/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {header, setCursor} from '../../../../../../tests/editor';
import {TestParts, testTitle} from '../../../../../../tests/parts';
import {byQa, createEditorWithRenderer, settle} from '../../../../../../tests/toolbar';

describe('Header toolbar', () => {
    const {start, markup} = createEditorWithRenderer((builder) =>
        builder.use(BoldSpecs).use(BlockquoteSpecs),
    );

    afterEach(() => {
        Reflect.deleteProperty(navigator, 'clipboard');
    });

    it.each([
        {name: 'an empty banner', source: header('')},
        {
            name: 'a banner with formatted blocks',
            source: `Before\n\n${header('Keep **text**', '> quote')}\n\nAfter`,
        },
    ])('should copy the Markdown of $name and keep the document', async ({source}) => {
        const writeText = vi.fn(() => Promise.resolve());
        Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true});
        const editor = await start(source);
        const before = markup(editor);
        let pos = 0;
        editor.state.doc.forEach((node, offset) => {
            if (node.type.name === 'header') pos = offset;
        });
        setCursor(editor, pos + 2);
        await settle(() => byQa('header-copy'));
        await act(async () => byQa('header-copy')?.click());
        await settle(() => writeText.mock.calls.length);
        const banner = before.slice(before.indexOf(':::header'), before.lastIndexOf(':::') + 3);
        expect(writeText).toHaveBeenCalledWith(banner);
        expect(markup(editor)).toBe(before);
    });

    it('should copy the banner with the cursor and not its neighbour', async () => {
        const writeText = vi.fn(() => Promise.resolve());
        Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true});
        const second = ':::header{height="l" width="s"}\n\nSecond **banner**\n\n:::';
        const editor = await start(`${header('First')}\n\n${second}`);
        setCursor(editor, editor.state.doc.child(0).nodeSize + 2);
        await settle(() => byQa('header-copy'));
        await act(async () => byQa('header-copy')?.click());
        await settle(() => writeText.mock.calls.length);
        expect(writeText).toHaveBeenCalledTimes(1);
        expect(writeText).toHaveBeenCalledWith(second);
    });
});

describe('Header settings switches', () => {
    const {start, markup} = createEditorWithRenderer(TestParts([testTitle]));

    const settingsButton = () =>
        Array.from(document.querySelectorAll('button')).find((button) =>
            button.getAttribute('aria-label')?.startsWith('Settings'),
        );
    const switchOf = (label: string) => {
        const id = Array.from(document.querySelectorAll('label')).find(
            (element) => element.textContent === label,
        )?.htmlFor;
        return id ? document.querySelector<HTMLInputElement>(`[id="${id}"]`) : null;
    };

    it('should show the parts of the banner and switch a part off and back on', async () => {
        const editor = await start(header('Text', 'More'));
        setCursor(editor, 2);
        await settle(settingsButton);
        await act(async () => settingsButton()?.click());
        await settle(() => byQa('header-settings'));
        expect(switchOf('Title')?.checked).toBe(false);
        expect(switchOf('Title')?.disabled).toBe(false);
        await act(async () => switchOf('Title')?.click());
        expect(markup(editor)).toBe(header(`[${testTitle}]\nTitle`, 'Text', 'More'));
        await settle(() => switchOf('Title')?.checked);
        await act(async () => switchOf('Title')?.click());
        expect(markup(editor)).toBe(header('Text', 'More'));
        await settle(() => switchOf('Title')?.checked === false);
    });
});
