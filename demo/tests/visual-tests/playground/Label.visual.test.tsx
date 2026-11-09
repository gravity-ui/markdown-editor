import type {Selection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import type {Locator, Page} from '@playwright/test';
import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';
import type {MarkdownEditorPage} from 'playwright/core/editor';

import {LabelPlayground} from './Label.helpers';
import {Playground} from './Playground.helpers';

const markup = dd`
    Plain line of the paragraph text

    Before :label[Draft]{color=blue} after

    :label[Gray] :label[Green]{color=green} :label[Yellow]{color=yellow} :label[Blue]{color=blue} :label[Red]{color=red} :label[Purple]{color=purple}
`;

const isEditorFocused = (page: Page) =>
    page.evaluate(() => document.activeElement?.getAttribute('contenteditable') === 'true');

/** Sizes of the label in the text line. */
const measure = (root: Locator) =>
    root.evaluate((element) => {
        const [plain, withLabel] = Array.from(element.querySelectorAll('p'));
        const label = withLabel.querySelector('.g-md-label-plugin') as HTMLElement;
        const style = getComputedStyle(label);
        const labelRect = label.getBoundingClientRect();
        const lineRect = withLabel.getBoundingClientRect();

        return {
            labelCount: element.querySelectorAll('.g-md-label-plugin').length,
            fontSize: getComputedStyle(plain).fontSize,
            lineHeight: getComputedStyle(plain).lineHeight,
            plainHeight: plain.getBoundingClientRect().height,
            lineHeightWithLabel: lineRect.height,
            labelTopGap: labelRect.top - lineRect.top,
            labelBottomGap: lineRect.bottom - labelRect.bottom,
            label: {
                height: labelRect.height,
                padding: style.padding,
                borderWidth: style.borderTopWidth,
                borderRadius: style.borderRadius,
                lineHeight: style.lineHeight,
            },
        };
    });

const expectLabelMetrics = (metrics: Awaited<ReturnType<typeof measure>>) => {
    expect(metrics.labelCount).toBe(7);
    expect(metrics.fontSize).toBe('15px');
    expect(metrics.lineHeight).toBe('20px');
    expect(metrics.lineHeightWithLabel).toBe(metrics.plainHeight);
    expect(metrics.labelTopGap).toBeGreaterThanOrEqual(0);
    expect(metrics.labelBottomGap).toBeGreaterThanOrEqual(0);
    expect(metrics.label).toEqual({
        height: 20,
        padding: '1px 9px',
        borderWidth: '0px',
        borderRadius: '1000px',
        lineHeight: '18px',
    });
};

test.describe('Label', () => {
    test.beforeEach(async ({mount, page, editor}) => {
        await mount(<LabelPlayground initial={markup} />);
        await page.setViewportSize({height: 500, width: 812});
        await editor.switchMode('wysiwyg');
    });

    /** The page fits the playground with its margins and the popup of the first label. */
    const fitPopupPage = (page: Page) => page.setViewportSize({width: 852, height: 580});

    /** Puts the cursor before the label of the second paragraph: `Before |[Draft] after`. */
    const placeCursorBeforeLabel = async (page: Page, editor: MarkdownEditorPage) => {
        const line = editor.locators.contenteditable.locator('p').nth(1);
        await line.click({position: {x: 1, y: 10}});
        await editor.press('Home');
        await editor.press('ArrowRight', 'Before '.length);
        await expect(page.locator('.playground__pm-selection')).toContainText('Cursor: 42');
    };

    test('should render the palette in the WYSIWYG mode @wysiwyg', async ({
        editor,
        expectScreenshot,
    }) => {
        expectLabelMetrics(await measure(editor.locators.contenteditable));

        await expectScreenshot();
    });

    test('should render the palette in the preview @markup', async ({
        page,
        wait,
        editor,
        expectScreenshot,
    }) => {
        await editor.switchMode('markup');
        await editor.switchPreview('visible');
        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();

        const preview = editor.locators.previewContent;
        await expect(preview.locator('.g-md-label-plugin')).toHaveCount(7);
        expectLabelMetrics(await measure(preview));

        await expectScreenshot();
    });

    test('should open the popover on arrows without moving the focus @wysiwyg', async ({
        page,
        editor,
        expectScreenshot,
    }) => {
        await fitPopupPage(page);
        await placeCursorBeforeLabel(page, editor);

        const contenteditable = editor.locators.contenteditable;
        await expect(contenteditable).toHaveClass(/no-cursor/);
        await expect(contenteditable.locator('.fake-cursor')).toHaveCount(1);
        await expect(editor.label.popup).toBeHidden();

        await editor.press('ArrowRight');
        await expect(editor.label.popup).toBeVisible();
        await expect(contenteditable.locator('.fake-cursor')).toHaveCount(0);
        expect(await isEditorFocused(page)).toBe(true);

        await expectScreenshot({fullPage: true, nameSuffix: 'passive popover'});

        await editor.press('ArrowRight');
        await expect(editor.label.popup).toBeHidden();
        await expect(contenteditable.locator('.fake-cursor')).toHaveCount(1);

        await editor.pressSequentially('X');
        await expect(contenteditable.locator('p').nth(1)).toHaveText('Before DraftX after');

        await editor.press('ArrowLeft');
        await expect(contenteditable.locator('.fake-cursor')).toHaveCount(1);
        await editor.press('ArrowLeft');
        await expect(editor.label.popup).toBeVisible();
        await editor.press('ArrowLeft');
        await expect(editor.label.popup).toBeHidden();

        await editor.pressSequentially('Y');
        await expect(contenteditable.locator('p').nth(1)).toHaveText('Before YDraftX after');
        expect(await isEditorFocused(page)).toBe(true);
    });

    test('should close the passive popover on Escape without reopening @wysiwyg', async ({
        page,
        editor,
        wait,
    }) => {
        await placeCursorBeforeLabel(page, editor);
        await editor.press('ArrowRight');
        await expect(editor.label.popup).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(editor.label.popup).toBeHidden();
        await wait.timeout(500);
        await expect(editor.label.popup).toBeHidden();
        expect(await isEditorFocused(page)).toBe(true);
        await expect(editor.label.labels).toHaveCount(7);

        await editor.press('ArrowLeft');
        await expect(editor.label.popup).toBeVisible();
    });

    test('should move the focus to the caption on Tab from a selected label @wysiwyg', async ({
        page,
        editor,
    }) => {
        await placeCursorBeforeLabel(page, editor);
        await editor.press('ArrowRight');
        await expect(editor.label.popup).toBeVisible();
        expect(await isEditorFocused(page)).toBe(true);

        await page.keyboard.press('Tab');
        await expect(editor.label.input).toBeFocused();
        await expect(editor.label.labels).toHaveCount(7);

        await page.keyboard.press('Shift+Tab');
        expect(await isEditorFocused(page)).toBe(true);
        await expect(editor.label.popup).toBeVisible();
    });

    test('should move the focus to the caption on a click @wysiwyg', async ({
        page,
        wait,
        expectScreenshot,
        editor,
    }) => {
        await fitPopupPage(page);
        await editor.label.labels.first().click();

        await expect(page.getByRole('dialog', {name: 'Label'})).toBeVisible();
        await expect(editor.label.input).toBeFocused();

        const selected = editor.label.selectedColor;
        await expect(selected).toHaveCount(1);
        await expect(selected).toHaveAttribute('aria-label', 'Blue');

        await editor.label.color('Green').click();
        await expect(editor.label.labels.first()).toHaveClass(/g-md-label-plugin_color_green/);
        await expect(editor.label.selectedColor).toHaveAttribute('aria-label', 'Green');

        await editor.label.input.focus();
        await editor.label.input.press('End');
        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        await wait.markupPreview(':label[Draft]{color=green}');
        await expectScreenshot({fullPage: true, nameSuffix: 'edit popover'});
    });

    test('should mark the selected color with a ring @wysiwyg', async ({
        page,
        wait,
        editor,
        expectScreenshot,
    }) => {
        await editor.label.labels.first().click();
        await expect(editor.label.popup).toBeVisible();

        for (const color of ['Gray', 'Green', 'Yellow', 'Blue', 'Red', 'Purple']) {
            await editor.label.color(color).click();
            await expect(editor.label.color(color)).toHaveAttribute('aria-pressed', 'true');
            await expect(editor.label.selectedColor).toHaveCount(1);
            await expect(editor.label.labels.first()).toHaveAttribute(
                'data-color',
                color.toLowerCase(),
            );
            await expect(editor.label.input).toHaveValue('Draft');
        }

        await editor.label.color('Yellow').click();
        await editor.label.color('Yellow').focus();
        await page.keyboard.press('Shift');
        await expect(editor.label.color('Yellow')).toBeFocused();

        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        // The markup pane behind the edge of the popup shows the last color.
        await wait.markupPreview(':label[Draft]{color=yellow}');
        await expectScreenshot({component: editor.label.popup, nameSuffix: 'focused swatch'});
    });

    test('should lay out the popup as in the design @wysiwyg', async ({editor}) => {
        await editor.label.labels.first().click();
        await editor.label.waitForPopupAnimations();
        const geometry = await editor.label.popup.evaluate((root) => {
            const label = document.querySelector('[contenteditable=true] .g-md-label-plugin');
            const field = root.querySelector('.g-text-input__content');
            const clear = root.querySelector('.g-text-input__clear');
            const clearIcon = clear?.querySelector('svg');
            const colors = root.querySelector('.g-md-label-colors');
            const popup = root.closest('.g-popup');
            const swatches = Array.from(root.querySelectorAll('.g-md-label-colors__swatch'));
            if (
                !label ||
                !field ||
                !clear ||
                !clearIcon ||
                !colors ||
                !popup ||
                swatches.length < 2
            ) {
                throw new Error('Missing popup content');
            }
            const anchor = label.getBoundingClientRect();
            const frame = popup.getBoundingClientRect();
            const panel = root.getBoundingClientRect();
            const input = field.getBoundingClientRect();
            const button = clear.getBoundingClientRect();
            const icon = clearIcon.getBoundingClientRect();
            const palette = colors.getBoundingClientRect();
            const [first, second] = swatches.map((swatch) => swatch.getBoundingClientRect());
            const round = (n: number) => Math.round(n);
            return {
                offset: round(frame.top - anchor.bottom),
                alignLeft: round(frame.left - anchor.left),
                width: round(panel.width),
                fieldWidth: round(input.width),
                fieldHeight: round(input.height),
                fieldRadius: getComputedStyle(field).borderRadius,
                clear: {
                    width: round(button.width),
                    height: round(button.height),
                    radius: getComputedStyle(clear, '::before').borderRadius,
                    icon: round(icon.width),
                },
                left: round(input.left - panel.left),
                right: round(panel.right - input.right),
                top: round(input.top - panel.top),
                gap: round(palette.top - input.bottom),
                paddingBottom: getComputedStyle(root).paddingBottom,
                swatch: {width: round(first.width), height: round(first.height)},
                swatchGap: round(second.left - first.right),
                swatchRadius: getComputedStyle(swatches[0]).borderRadius,
                popupRadius: getComputedStyle(popup).borderRadius,
            };
        });
        expect(geometry).toEqual({
            offset: 8,
            alignLeft: 0,
            width: 240,
            fieldWidth: 208,
            fieldHeight: 28,
            fieldRadius: '10px',
            clear: {width: 24, height: 24, radius: '8px', icon: 14},
            left: 16,
            right: 16,
            top: 16,
            gap: 15,
            paddingBottom: '16px',
            swatch: {width: 28, height: 28},
            swatchGap: 8,
            swatchRadius: '10px',
            popupRadius: '16px',
        });
    });

    test('should clear the caption and keep the popover for typing @wysiwyg', async ({
        page,
        wait,
        editor,
    }) => {
        await editor.label.labels.first().click();
        await expect(editor.label.input).toBeFocused();

        await editor.label.clearButton.click();
        await expect(editor.label.popup).toBeVisible();
        await expect(editor.label.input).toHaveValue('');
        await expect(editor.label.input).toBeFocused();
        await expect(editor.label.labels).toHaveCount(7);

        await page.keyboard.type('Done');
        await expect(editor.label.input).toHaveValue('Done');
        await expect(editor.label.labels.first()).toHaveText('Done');

        await page.keyboard.press('Escape');
        await expect(editor.label.popup).toBeHidden();
        await wait.timeout(500);
        await expect(editor.label.popup).toBeHidden();
        expect(await isEditorFocused(page)).toBe(true);
        await expect(editor.label.labels.first()).toHaveText('Done');
    });

    test('should remove an empty label on Escape @wysiwyg', async ({page, editor}) => {
        await editor.label.labels.first().click();
        await editor.label.clearButton.click();
        await expect(editor.label.input).toHaveValue('');

        await page.keyboard.press('Escape');
        await expect(editor.label.popup).toBeHidden();
        await expect(editor.label.labels).toHaveCount(6);
        expect(await isEditorFocused(page)).toBe(true);
    });

    test('should close the popover on an outside click @wysiwyg', async ({page, wait, editor}) => {
        const clickOutside = async () => {
            const point = await page.evaluate(() => {
                const editorRoot = document.querySelector('[data-qa=g-md-editor-mode]');
                const popup = document.querySelector('.g-md-label-tooltip');
                for (let y = 20; y < document.documentElement.clientHeight - 20; y += 10) {
                    for (let x = 2; x < window.innerWidth; x += 50) {
                        const target = document.elementFromPoint(x, y);
                        if (target && !editorRoot?.contains(target) && !popup?.contains(target)) {
                            if (!target.closest('button, a, input, textarea, [contenteditable]')) {
                                return {x, y};
                            }
                        }
                    }
                }
                return null;
            });

            if (!point) throw new Error('No free point outside the editor');
            await page.mouse.click(point.x, point.y);
        };

        await editor.label.labels.first().click();
        await expect(editor.label.popup).toBeVisible();
        await clickOutside();
        await expect(editor.label.popup).toBeHidden();
        await wait.timeout(500);
        await expect(editor.label.popup).toBeHidden();
        await expect(editor.label.labels).toHaveCount(7);

        await editor.label.labels.first().click();
        await editor.label.clearButton.click();
        await clickOutside();
        await expect(editor.label.popup).toBeHidden();
        await expect(editor.label.labels).toHaveCount(6);
    });

    test('should confirm the caption without splitting the paragraph @wysiwyg', async ({
        page,
        editor,
    }) => {
        const paragraphs = editor.locators.contenteditable.locator('p');
        const count = await paragraphs.count();
        await editor.label.labels.first().click();
        await editor.label.input.fill('Ready');
        await page.keyboard.press('Enter');
        await expect(editor.label.popup).toBeHidden();
        await expect(paragraphs).toHaveCount(count);
        await expect(paragraphs.nth(1)).toHaveText('Before Ready after');
    });

    test('should return focus after clearing the caption with the keyboard @wysiwyg', async ({
        page,
        editor,
    }) => {
        await editor.label.labels.first().click();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');
        await expect(editor.label.input).toBeFocused();
        await expect(editor.label.input).toHaveValue('');
        await page.keyboard.type('Again');
        await expect(editor.label.input).toHaveValue('Again');
    });

    test('should refocus the caption on every explicit edit request @wysiwyg', async ({
        page,
        editor,
    }) => {
        await editor.label.labels.first().click();
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Enter');
        await expect(editor.label.input).toBeFocused();
        await editor.label.color('Red').click();
        await editor.label.labels.first().click();
        await expect(editor.label.input).toBeFocused();
    });

    test('should close from a color with one Escape and keep typing outside @wysiwyg', async ({
        page,
        editor,
    }) => {
        await editor.label.labels.first().click();
        await editor.label.color('Red').focus();
        await page.keyboard.press('Escape');
        await expect(editor.label.popup).toBeHidden();
        await page.keyboard.type('Q');
        await expect(editor.label.labels).toHaveCount(7);
        await expect(editor.locators.contenteditable.locator('p').nth(1)).toHaveText(
            'Before DraftQ after',
        );
    });

    test('should preserve the label when typing from passive navigation @wysiwyg', async ({
        page,
        editor,
    }) => {
        await placeCursorBeforeLabel(page, editor);
        await editor.press('ArrowRight');
        await page.keyboard.type('Q');
        await expect(editor.label.labels).toHaveCount(7);
        await expect(editor.locators.contenteditable.locator('p').nth(1)).toHaveText(
            'Before DraftQ after',
        );
    });

    test('should preserve brackets through a mode round trip @wysiwyg', async ({page, editor}) => {
        await editor.label.labels.first().click();
        await editor.label.input.fill('a [b] c');
        await page.keyboard.press('Escape');
        await editor.switchMode('markup');
        await editor.switchMode('wysiwyg');
        await expect(editor.label.labels).toHaveCount(7);
        await expect(editor.label.labels.first()).toHaveText('a [b] c');
        await expect(editor.label.labels.first()).toHaveAttribute('data-color', 'blue');
    });

    test('should preserve selected text and focus its inserted caption @wysiwyg', async ({
        page,
        editor,
    }) => {
        const line = editor.locators.contenteditable.locator('p').first();
        await line.click();
        await editor.press('Home');
        await editor.press('Shift+ArrowRight', 5);
        await editor.clickMainToolbarButton('Label');
        await expect(editor.label.input).toBeFocused();
        await expect(editor.label.input).toHaveValue('Plain');
        await page.keyboard.type('Ready');
        await expect(editor.label.input).toHaveValue('Ready');
        await expect(editor.label.labels.first()).toHaveText('Ready');
    });

    test('should refresh page suggestions when another label changes @wysiwyg', async ({
        page,
        editor,
    }) => {
        await editor.label.labels.first().click();
        await expect(editor.label.suggestion('Green, color: green')).toBeVisible();
        await page.evaluate(() => {
            const view = (window.mdEditor as {_wysiwygView?: EditorView} | undefined)?._wysiwygView;
            if (!view) throw new Error('Missing editor');
            let target: number | undefined;
            view.state.doc.descendants((node, pos) => {
                if (node.type.name === 'label' && node.attrs.text === 'Green') target = pos;
            });
            if (target === undefined) throw new Error('Missing source label');
            view.dispatch(
                view.state.tr.setNodeMarkup(target, undefined, {text: 'Ready', color: 'red'}),
            );
        });
        await expect(editor.label.suggestion('Green, color: green')).toHaveCount(0);
        await expect(editor.label.suggestion('Ready, color: red')).toBeVisible();
        await expect(editor.label.input).toHaveValue('Draft');
        await expect(editor.label.input).toBeFocused();
    });

    test('should reuse a page label and its color with keyboard navigation @wysiwyg', async ({
        page,
        editor,
    }) => {
        await editor.label.labels.first().click();
        await expect(editor.label.suggestions.getByRole('button')).toHaveCount(6);
        const green = editor.label.suggestion('Green, color: green');
        await green.focus();
        await page.keyboard.press('ArrowDown');
        await expect(editor.label.suggestion('Yellow, color: yellow')).toBeFocused();
        await page.keyboard.press('ArrowUp');
        await expect(green).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(editor.label.popup).toBeHidden();
        await expect(editor.label.labels.first()).toHaveText('Green');
        await expect(editor.label.labels.first()).toHaveAttribute('data-color', 'green');
        await expect(editor.label.labels.nth(2)).toHaveText('Green');
        expect(await isEditorFocused(page)).toBe(true);
    });

    test('should update a long caption live without moving the left aligned popup @wysiwyg', async ({
        editor,
    }) => {
        await editor.label.labels.first().click();
        await editor.label.waitForPopupAnimations();
        const before = await editor.label.popup.boundingBox();
        if (!before) throw new Error('Missing popup');
        const options = await editor.label.suggestions.textContent();
        for (const text of [
            'A',
            'A longer caption with spaces',
            'A longer caption with spaces '.repeat(8),
        ]) {
            await editor.label.input.fill(text);
            await expect(editor.label.labels.first()).toHaveText(text);
            const after = await editor.label.popup.boundingBox();
            if (!after) throw new Error('Missing popup after typing');
            expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(1);
            expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
            expect(await editor.label.suggestions.textContent()).toBe(options);
        }
        await editor.label.color('Red').click();
        await expect(editor.label.input).toHaveValue('A longer caption with spaces '.repeat(8));
        await expect(editor.label.labels.first()).toHaveAttribute('data-color', 'red');
    });

    test('should focus the caption of an inserted label @wysiwyg', async ({page, editor}) => {
        await page.getByTestId('g-md-editor-mode').getByText('Plain line').click();
        await editor.press('End');
        await editor.press('Enter');
        await editor.selectFromCommandMenu('label', 'Label');

        await expect(editor.label.popup).toBeVisible();
        await expect(editor.label.input).toBeFocused();
        await expect(editor.label.input).toHaveValue('');
        await expect(
            editor.label.labels.locator('.g-md-label-plugin__text[data-placeholder]'),
        ).toHaveAttribute('data-placeholder', 'Set status');
        await expect(editor.label.labels).toHaveCount(8);
    });

    test('should undo a color change from the popup @wysiwyg', async ({page, editor}) => {
        await editor.label.labels.first().click();
        await editor.label.color('Red').click();
        await expect(editor.label.labels.first()).toHaveAttribute('data-color', 'red');

        await page.keyboard.press('ControlOrMeta+z');
        await expect(editor.label.labels.first()).toHaveAttribute('data-color', 'blue');
        expect(await isEditorFocused(page)).toBe(true);
        await expect(editor.label.selectedColor).toHaveAttribute('aria-label', 'Blue');
    });
    test('should delete a label with Backspace and restore it on undo @wysiwyg', async ({
        editor,
    }) => {
        await editor.label.placeCursor('after');
        await editor.press('Backspace');
        await expect(editor.label.labels).toHaveCount(6);

        await editor.press('ControlOrMeta+z');
        await expect(editor.label.labels).toHaveCount(7);
        await expect(editor.label.labels.last()).toHaveText('Purple');
    });

    test('should insert a new label after the selected one on the toolbar button @wysiwyg', async ({
        editor,
    }) => {
        await editor.label.placeCursor('selected');
        await expect(
            editor.locators.toolbars.main.getByRole('button', {name: 'Label', exact: true}),
        ).toHaveAttribute('aria-pressed', 'false');
        await editor.clickMainToolbarButton('Label');

        await expect(editor.label.input).toBeFocused();
        await expect(editor.label.input).toHaveValue('');
        await expect(editor.label.labels).toHaveCount(8);
        await expect(editor.label.labels.nth(6)).toHaveText('Purple');
    });
});

test.describe('Label in a table', () => {
    test('should keep a pipe in the caption through a mode round trip @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(
            <Playground
                initial={'| a | b |\n|---|---|\n| :label[x\\|y]{color=red} | c |'}
                width="100%"
                style={{width: 812}}
            />,
        );
        await editor.switchMode('wysiwyg');
        await expect(editor.label.labels).toHaveText('x|y');

        await editor.switchMode('markup');
        await editor.switchMode('wysiwyg');

        await expect(editor.locators.contenteditable.locator('td')).toHaveCount(2);
        await expect(editor.label.labels).toHaveText('x|y');
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toContain(':label[x\\|y]{color=red}|c|');
    });
});

test.describe('Label, former markup', () => {
    test('should read the former status directive @wysiwyg', async ({mount, editor}) => {
        await mount(
            <Playground
                initial=":status[Old]{color=teal} text"
                width="100%"
                style={{width: 812}}
            />,
        );
        await editor.switchMode('wysiwyg');

        await expect(editor.label.labels).toHaveCount(1);
        await expect(editor.label.labels.first()).toHaveText('Old');
        await expect(editor.label.labels.first()).toHaveAttribute('data-color', 'blue');
    });
});

test.describe('Label boundary regressions', () => {
    test('should enter neighboring code without trapping the caret @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(<Playground initial=":label[L]`code` z" width="100%" style={{width: 812}} />);
        await editor.switchMode('wysiwyg');
        const content = editor.locators.contenteditable;
        await editor.label.labels.click();
        await page.keyboard.press('Escape');
        await editor.press('ArrowRight', 2);
        await expect(content.locator('.fake-cursor')).toHaveCount(0);
        await page.keyboard.type('Q');
        await expect(content.locator('code')).toHaveText('cQode');
        await expect(editor.label.labels).toHaveText('L');
    });

    test('should leave preceding code outside the mark @wysiwyg', async ({mount, page, editor}) => {
        await mount(<Playground initial="a `code`:label[L] z" width="100%" style={{width: 812}} />);
        await editor.switchMode('wysiwyg');
        const content = editor.locators.contenteditable;
        await editor.label.labels.click();
        await page.keyboard.press('Escape');
        await editor.press('ArrowLeft', 2);
        await expect(content.locator('.fake-cursor')).toHaveCount(1);
        await page.keyboard.type('Q');
        await expect(content.locator('code')).toHaveText('code');
        await expect(content.locator('p')).toHaveText('a codeQL z');
    });

    test('should move to the line end and next line from the leading label @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(
            <Playground
                initial={':label[Lead] middle tail\n\nNext line'}
                width="100%"
                style={{width: 812}}
            />,
        );
        await editor.switchMode('wysiwyg');
        await editor.locators.contenteditable
            .locator('p')
            .first()
            .click({position: {x: 100, y: 8}});
        await editor.press('Home');
        await expect(page.locator('.playground__pm-selection')).toContainText(/Cursor: 1$/);
        await editor.press('End');
        await expect(page.locator('.playground__pm-selection')).toContainText(/Cursor: 14$/);
        for (let i = 0; i < 3; i++) {
            // Repeated clicks within 500 ms select words/paragraphs in ProseMirror.
            // Control+Home updates ProseMirror through the native selectionchange event.
            await editor.press('Control+Home');
            await expect(page.locator('.playground__pm-selection')).toContainText(/Cursor: 1$/);
            await editor.press('End');
            await expect(page.locator('.playground__pm-selection')).toContainText(/Cursor: 14$/);
            await editor.press('Home');
            await editor.press('ArrowDown');
            await expect(page.locator('.playground__pm-selection')).toContainText(/Cursor: 16$/);
        }
    });
});

test.describe('Label vertical navigation', () => {
    /** Up and Down from every position at the label reach the neighboring visual lines. */
    const expectNeighboringLines = async (page: Page, editor: MarkdownEditorPage) => {
        for (const side of ['before', 'selected', 'after'] as const) {
            for (const key of ['ArrowUp', 'ArrowDown']) {
                await editor.label.placeCursor(side);
                const before = await editor.label.readCursor();
                await page.keyboard.press(key);
                await expect
                    .poll(async () => {
                        const after = await editor.label.readCursor();
                        return key === 'ArrowUp'
                            ? after.bottom < before.top
                            : after.top > before.bottom;
                    })
                    .toBe(true);
                if (side !== 'selected') {
                    const {left} = await editor.label.readCursor();
                    expect(Math.abs(left - before.left)).toBeLessThan(9);
                }
            }
        }
    };

    test('should reach neighboring visual lines from a label in a paragraph @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(
            <Playground
                initial={'abcdefghijklmnop\n\nprefix :label[Middle] suffix\n\nabcdefghijklmnop'}
                width="100%"
                style={{width: 812}}
            />,
        );
        await editor.switchMode('wysiwyg');
        await expectNeighboringLines(page, editor);
    });

    test('should reach neighboring visual lines from a label in a quote @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(
            <Playground
                initial={
                    '> abcdefghijklmnop\n>\n> prefix :label[Middle] suffix\n>\n> abcdefghijklmnop'
                }
                width="100%"
                style={{width: 812}}
            />,
        );
        await editor.switchMode('wysiwyg');
        await expectNeighboringLines(page, editor);
    });

    test('should reach neighboring visual lines from a label in a list @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(
            <Playground
                initial={'- abcdefghijklmnop\n- prefix :label[Middle] suffix\n- abcdefghijklmnop'}
                width="100%"
                style={{width: 812}}
            />,
        );
        await editor.switchMode('wysiwyg');
        await expectNeighboringLines(page, editor);
    });

    test('should reach neighboring visual lines from a label in a neighboring code @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(
            <Playground
                initial={'abcdefghijklmnop\n\n`code`:label[Middle]`after`\n\nabcdefghijklmnop'}
                width="100%"
                style={{width: 812}}
            />,
        );
        await editor.switchMode('wysiwyg');
        await expectNeighboringLines(page, editor);
    });

    test('should reach neighboring visual lines from a label in a standalone label @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(
            <Playground
                initial={'abcdefghijklmnop\n\n:label[Only]\n\nabcdefghijklmnop'}
                width="100%"
                style={{width: 812}}
            />,
        );
        await editor.switchMode('wysiwyg');
        await expectNeighboringLines(page, editor);
    });

    test('should retain the preferred column across shorter lines @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(
            <Playground
                initial={
                    'abcdefghijklmnopqrstuvwxyz\n\nx\n\nprefix :label[Middle] suffix\n\nx\n\nabcdefghijklmnopqrstuvwxyz'
                }
                width="100%"
                style={{width: 812}}
            />,
        );
        await editor.switchMode('wysiwyg');
        for (const key of ['ArrowUp', 'ArrowDown']) {
            await editor.label.placeCursor('after');
            const initial = await editor.label.readCursor();
            await page.keyboard.press(key);
            await expect
                .poll(async () => Math.abs((await editor.label.readCursor()).top - initial.top))
                .toBeGreaterThan(20);
            const short = await editor.label.readCursor();
            expect(short.left).toBeLessThan(initial.left - 20);
            await page.keyboard.press(key);
            await expect
                .poll(async () => Math.abs((await editor.label.readCursor()).top - short.top))
                .toBeGreaterThan(20);
            expect(Math.abs((await editor.label.readCursor()).left - initial.left)).toBeLessThan(9);
        }
    });

    test('should move between wrapped visual lines without leaving the paragraph @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(
            <Playground
                initial={'abcdefghij '.repeat(5) + ':label[Middle] ' + 'abcdefghij '.repeat(7)}
                width="100%"
                style={{width: 240}}
            />,
        );
        await editor.switchMode('wysiwyg');
        for (const side of ['before', 'after'] as const) {
            for (const key of ['ArrowUp', 'ArrowDown']) {
                await editor.label.placeCursor(side);
                const before = await editor.label.readCursor();
                await page.keyboard.press(key);
                await expect
                    .poll(async () => {
                        const after = await editor.label.readCursor();
                        return key === 'ArrowUp'
                            ? after.bottom <= before.top
                            : after.top >= before.bottom;
                    })
                    .toBe(true);
                expect(Math.abs((await editor.label.readCursor()).left - before.left)).toBeLessThan(
                    9,
                );
            }
        }
    });

    test('should continue vertical navigation through the scrollport on a long page @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(
            <Playground
                initial={
                    'prefix :label[Middle] suffix\n\n' +
                    Array.from(
                        {length: 300},
                        (_, i) => `Line ${i} with enough text for navigation`,
                    ).join('\n\n')
                }
                width="100%"
                style={{width: 812}}
            />,
        );
        await page.setViewportSize({width: 812, height: 500});
        await editor.switchMode('wysiwyg');
        await editor.label.placeCursor('after');
        let previous = (await editor.label.readCursor()).pos;
        for (let i = 0; i < 16; i++) {
            await page.keyboard.press('ArrowDown');
            await expect
                .poll(async () => (await editor.label.readCursor()).pos)
                .toBeGreaterThan(previous);
            previous = (await editor.label.readCursor()).pos;
        }
        expect(
            await page.evaluate(() => {
                const content = document.querySelector('.ProseMirror');
                return content && content.getBoundingClientRect().top < 0;
            }),
        ).toBe(true);
        for (let i = 0; i < 12; i++) {
            await page.keyboard.press('ArrowUp');
            await expect
                .poll(async () => (await editor.label.readCursor()).pos)
                .toBeLessThan(previous);
            previous = (await editor.label.readCursor()).pos;
        }
    });

    test('should enter list items under and above a leading label @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(
            <Playground
                initial={':label[Top]\n\n- first\n- second\n\n:label[Bottom]'}
                width="100%"
                style={{width: 812}}
            />,
        );
        await editor.switchMode('wysiwyg');
        const expectLine = (line: string) =>
            expect.poll(async () => (await editor.label.readCursor()).line).toBe(line);

        await editor.label.placeCursor('before');
        await expectLine('Bottom');
        for (const line of ['second', 'first', 'Top']) {
            await page.keyboard.press('ArrowUp');
            await expectLine(line);
        }
        for (const line of ['first', 'second', 'Bottom']) {
            await page.keyboard.press('ArrowDown');
            await expectLine(line);
        }
    });

    test('should preserve the native preferred column when entering an atom-only line @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(
            <Playground
                initial={'abcdefghijklmnopqrstuvwxyz\n\n:label[L]\n\nabcdefghijklmnopqrstuvwxyz'}
                width="100%"
                style={{width: 812}}
            />,
        );
        await editor.switchMode('wysiwyg');
        for (const key of ['ArrowDown', 'ArrowUp']) {
            await page.evaluate((direction) => {
                const view = (window.mdEditor as unknown as {_wysiwygView: EditorView})
                    ._wysiwygView;
                const positions: number[] = [];
                view.state.doc.descendants((node, pos) => {
                    if (node.isTextblock) positions.push(pos + 1);
                });
                const start =
                    direction === 'ArrowDown' ? positions[0] : positions[positions.length - 1];
                const SelectionClass = view.state.selection.constructor as typeof Selection;
                view.dispatch(
                    view.state.tr.setSelection(
                        SelectionClass.near(view.state.doc.resolve(start + 19)),
                    ),
                );
                view.focus();
            }, key);
            const initial = await editor.label.readCursor();
            await page.keyboard.press(key);
            await expect
                .poll(async () => Math.abs((await editor.label.readCursor()).top - initial.top))
                .toBeGreaterThan(20);
            const short = await editor.label.readCursor();
            expect(short.left).toBeLessThan(initial.left - 50);
            await page.keyboard.press(key);
            await expect
                .poll(async () => Math.abs((await editor.label.readCursor()).top - short.top))
                .toBeGreaterThan(20);
            expect(Math.abs((await editor.label.readCursor()).left - initial.left)).toBeLessThan(9);
        }
    });
});
