import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import type {Locator, Page} from '@playwright/test';
import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {LabelPlayground} from './Label.helpers';
import {Playground} from './Playground.helpers';

const markup = dd`
    Plain line of the paragraph text

    Before :label[Draft]{color=blue} after

    :label[Gray] :label[Green]{color=green} :label[Yellow]{color=yellow} :label[Blue]{color=blue} :label[Red]{color=red} :label[Purple]{color=purple}
`;

/** Geometry of the selected swatch of a color palette and the offset of its check mark. */
const measureSelectedSwatch = (palette: Locator) =>
    palette.locator('[aria-pressed=true]').evaluate((item) => {
        const swatch = item.querySelector('.g-md-color-palette__swatch > *');
        const check = item.querySelector('.g-md-color-palette__check svg');
        if (!swatch || !check) throw new Error('No swatch or check mark');

        const itemRect = item.getBoundingClientRect();
        const swatchRect = swatch.getBoundingClientRect();
        const checkRect = check.getBoundingClientRect();
        const swatchStyle = getComputedStyle(swatch);
        // Fractional positions of a popup give sizes like 25.99998 px.
        const round = (value: number) => Math.round(value * 100) / 100;
        const size = (rect: DOMRect) => ({width: round(rect.width), height: round(rect.height)});
        const center = (rect: DOMRect) => ({
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
        });

        return {
            item: size(itemRect),
            itemPadding: getComputedStyle(item).padding,
            itemRadius: getComputedStyle(item).borderRadius,
            swatch: size(swatchRect),
            swatchBorder: swatchStyle.borderTopWidth,
            swatchRadius: swatchStyle.borderRadius,
            check: size(checkRect),
            offsetX: round(center(checkRect).x - center(swatchRect).x),
            offsetY: round(center(checkRect).y - center(swatchRect).y),
        };
    });

test.describe('Label', () => {
    test.beforeEach(async ({mount, page, editor}) => {
        await mount(<LabelPlayground initial={markup} />);
        await page.setViewportSize({height: 500, width: 812});
        await editor.switchMode('wysiwyg');
    });

    const getLabels = (page: Page) =>
        page.getByTestId('g-md-editor-mode').locator('[contenteditable=true] .g-md-label');
    const getPopup = (page: Page) => page.locator('.g-md-label-tooltip');
    const getInput = (page: Page) => getPopup(page).locator('input[type=text], input:not([type])');
    const isEditorFocused = (page: Page) =>
        page.evaluate(() => document.activeElement?.getAttribute('contenteditable') === 'true');

    /** Puts the cursor before the label of the second paragraph: `Before |[Draft] after`. */
    const placeCursorBeforeLabel = async (
        page: Page,
        editor: {press: (key: string, times?: number) => Promise<void>},
    ) => {
        const line = page
            .getByTestId('g-md-editor-mode')
            .locator('[contenteditable=true] p')
            .nth(1);
        await line.click({position: {x: 1, y: 10}});
        await editor.press('Home');
        await editor.press('ArrowRight', 'Before '.length);
        await expect(page.locator('.playground__pm-selection')).toContainText('Cursor: 42');
    };

    const measure = (root: Locator) =>
        root.evaluate((element) => {
            const getLabelStyle = (label: HTMLElement) => {
                const style = getComputedStyle(label);
                const textStyle = getComputedStyle(
                    label.querySelector('.g-label__text') as HTMLElement,
                );

                return {
                    height: label.getBoundingClientRect().height,
                    borderWidth: style.borderTopWidth,
                    borderRadius: style.borderRadius,
                    verticalAlign: style.verticalAlign,
                    color: style.color,
                    backgroundColor: style.backgroundColor,
                    margin: textStyle.margin,
                    fontFamily: textStyle.fontFamily,
                    fontSize: textStyle.fontSize,
                    fontWeight: textStyle.fontWeight,
                    lineHeight: textStyle.lineHeight,
                };
            };

            const [plain, withLabel] = Array.from(element.querySelectorAll('p'));
            const label = withLabel.querySelector('.g-md-label') as HTMLElement;
            const native = document.querySelector('.native-label') as HTMLElement;
            const style = getComputedStyle(plain);
            const labelRect = label.getBoundingClientRect();
            const lineRect = withLabel.getBoundingClientRect();

            return {
                fontSize: style.fontSize,
                lineHeight: style.lineHeight,
                plainHeight: plain.getBoundingClientRect().height,
                lineHeightWithLabel: lineRect.height,
                labelTopGap: labelRect.top - lineRect.top,
                labelBottomGap: lineRect.bottom - labelRect.bottom,
                labelCount: element.querySelectorAll('.g-md-label').length,
                labelStyle: getLabelStyle(label),
                nativeStyle: getLabelStyle(native),
            };
        });

    const expectLabelMetrics = (metrics: Awaited<ReturnType<typeof measure>>) => {
        expect(metrics.labelCount).toBe(7);
        expect(metrics.fontSize).toBe('15px');
        expect(metrics.lineHeight).toBe('20px');
        expect(metrics.lineHeightWithLabel).toBe(metrics.plainHeight);
        expect(metrics.labelTopGap).toBeGreaterThanOrEqual(0);
        expect(metrics.labelBottomGap).toBeGreaterThanOrEqual(0);
        // The label keeps the look of the UIKit Label of the same theme and size.
        expect(metrics.labelStyle).toEqual(metrics.nativeStyle);
        expect(metrics.labelStyle.height).toBe(20);
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
        await expect(preview.locator('.g-md-label')).toHaveCount(7);
        expectLabelMetrics(await measure(preview));

        await expectScreenshot({component: preview});
    });

    test('should open the popover on arrows without moving the focus @wysiwyg', async ({
        page,
        editor,
        expectScreenshot,
    }) => {
        await placeCursorBeforeLabel(page, editor);

        const contenteditable = editor.locators.contenteditable;
        await expect(contenteditable).toHaveClass(/no-cursor/);
        await expect(contenteditable.locator('.fake-cursor')).toHaveCount(1);
        await expect(getPopup(page)).toBeHidden();

        await editor.press('ArrowRight');
        await expect(getPopup(page)).toBeVisible();
        await expect(contenteditable.locator('.fake-cursor')).toHaveCount(0);
        expect(await isEditorFocused(page)).toBe(true);

        await expectScreenshot({nameSuffix: 'passive popover'});

        await editor.press('ArrowRight');
        await expect(getPopup(page)).toBeHidden();
        await expect(contenteditable.locator('.fake-cursor')).toHaveCount(1);

        await editor.pressSequentially('X');
        await expect(contenteditable.locator('p').nth(1)).toHaveText('Before DraftX after');

        await editor.press('ArrowLeft');
        await expect(contenteditable.locator('.fake-cursor')).toHaveCount(1);
        await editor.press('ArrowLeft');
        await expect(getPopup(page)).toBeVisible();
        await editor.press('ArrowLeft');
        await expect(getPopup(page)).toBeHidden();

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
        await expect(getPopup(page)).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(getPopup(page)).toBeHidden();
        await wait.timeout(500);
        await expect(getPopup(page)).toBeHidden();
        expect(await isEditorFocused(page)).toBe(true);
        await expect(getLabels(page)).toHaveCount(7);

        await editor.press('ArrowLeft');
        await expect(getPopup(page)).toBeVisible();
    });

    test('should move the focus to the caption on a click @wysiwyg', async ({
        page,
        wait,
        expectScreenshot,
    }) => {
        await getLabels(page).first().click();

        await expect(getPopup(page)).toBeVisible();
        await expect(getInput(page)).toBeFocused();

        const selected = getPopup(page).locator('[aria-pressed=true]');
        await expect(selected).toHaveCount(1);
        await expect(selected).toHaveAttribute('aria-label', 'Blue');

        await getPopup(page).getByLabel('Green', {exact: true}).click();
        await expect(getLabels(page).first()).toHaveClass(/g-label_theme_success/);
        await expect(getPopup(page).locator('[aria-pressed=true]')).toHaveAttribute(
            'aria-label',
            'Green',
        );

        await getInput(page).focus();
        await getInput(page).press('End');
        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        await wait.markupPreview(':label[Draft]{color=green}');
        await expectScreenshot({nameSuffix: 'edit popover'});
    });

    test('should center the check mark on the selected swatch @wysiwyg', async ({
        page,
        wait,
        expectScreenshot,
    }) => {
        const expectCentered = async () => {
            const metrics = await measureSelectedSwatch(getPopup(page));
            expect(Math.abs(metrics.offsetX)).toBeLessThanOrEqual(1);
            expect(Math.abs(metrics.offsetY)).toBeLessThanOrEqual(1);
        };

        await getLabels(page).first().click();
        await expect(getPopup(page)).toBeVisible();

        for (const color of ['Gray', 'Green', 'Yellow', 'Blue', 'Red', 'Purple']) {
            const swatch = getPopup(page).getByLabel(color, {exact: true});
            await swatch.click();
            await expect(swatch).toHaveAttribute('aria-pressed', 'true');
            await expect(getLabels(page).first()).toHaveAttribute(
                'data-color',
                color.toLowerCase(),
            );
            await expect(getInput(page)).toHaveValue('Draft');
            await expectCentered();
        }

        await getPopup(page).getByLabel('Yellow', {exact: true}).click();
        await getPopup(page).getByLabel('Yellow', {exact: true}).hover();
        await expectCentered();

        await getPopup(page).getByLabel('Yellow', {exact: true}).focus();
        await page.keyboard.press('Shift');
        await expect(getPopup(page).getByLabel('Yellow', {exact: true})).toBeFocused();
        await expectCentered();

        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        await expectScreenshot({component: getPopup(page), nameSuffix: 'focused swatch'});
    });

    test('should align the caption field and the palette inside the popup @wysiwyg', async ({
        page,
    }) => {
        await getLabels(page).first().click();
        const geometry = await getPopup(page).evaluate((root) => {
            const field = root.querySelector('.g-text-input');
            const palette = root.querySelector('.g-md-color-palette');
            const popup = root.closest('.g-popup');
            if (!field || !palette || !popup) throw new Error('Missing popup content');
            const panel = root.getBoundingClientRect(),
                input = field.getBoundingClientRect(),
                colors = palette.getBoundingClientRect();
            const round = (n: number) => Math.round(n);
            return {
                width: round(panel.width),
                fieldWidth: round(input.width),
                paletteWidth: round(colors.width),
                left: round(input.left - panel.left),
                right: round(panel.right - input.right),
                top: round(input.top - panel.top),
                gap: round(colors.top - input.bottom),
                bottom: parseFloat(getComputedStyle(root).paddingBottom),
                radius: getComputedStyle(popup).borderRadius,
            };
        });
        expect(geometry).toEqual({
            width: 180,
            fieldWidth: 156,
            paletteWidth: 156,
            left: 12,
            right: 12,
            top: 12,
            gap: 8,
            bottom: 12,
            radius: '8px',
        });
    });

    test('should clear the caption and keep the popover for typing @wysiwyg', async ({
        page,
        wait,
    }) => {
        await getLabels(page).first().click();
        await expect(getInput(page)).toBeFocused();

        await getPopup(page).locator('.g-text-input__clear').click();
        await expect(getPopup(page)).toBeVisible();
        await expect(getInput(page)).toHaveValue('');
        await expect(getInput(page)).toBeFocused();
        await expect(getLabels(page)).toHaveCount(7);

        await page.keyboard.type('Done');
        await expect(getInput(page)).toHaveValue('Done');
        await expect(getLabels(page).first()).toHaveText('Done');

        await page.keyboard.press('Escape');
        await expect(getPopup(page)).toBeHidden();
        await wait.timeout(500);
        await expect(getPopup(page)).toBeHidden();
        expect(await isEditorFocused(page)).toBe(true);
        await expect(getLabels(page).first()).toHaveText('Done');
    });

    test('should remove an empty label on Escape @wysiwyg', async ({page}) => {
        await getLabels(page).first().click();
        await getPopup(page).locator('.g-text-input__clear').click();
        await expect(getInput(page)).toHaveValue('');

        await page.keyboard.press('Escape');
        await expect(getPopup(page)).toBeHidden();
        await expect(getLabels(page)).toHaveCount(6);
        expect(await isEditorFocused(page)).toBe(true);
    });

    test('should close the popover on an outside click @wysiwyg', async ({page, wait}) => {
        const clickOutside = async () => {
            const point = await page.evaluate(() => {
                const editor = document.querySelector('[data-qa=g-md-editor-mode]');
                const popup = document.querySelector('.g-md-label-tooltip');
                for (let y = 20; y < document.documentElement.clientHeight - 20; y += 10) {
                    for (let x = 2; x < window.innerWidth; x += 50) {
                        const target = document.elementFromPoint(x, y);
                        if (target && !editor?.contains(target) && !popup?.contains(target)) {
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

        await getLabels(page).first().click();
        await expect(getPopup(page)).toBeVisible();
        await clickOutside();
        await expect(getPopup(page)).toBeHidden();
        await wait.timeout(500);
        await expect(getPopup(page)).toBeHidden();
        await expect(getLabels(page)).toHaveCount(7);

        await getLabels(page).first().click();
        await getPopup(page).locator('.g-text-input__clear').click();
        await clickOutside();
        await expect(getPopup(page)).toBeHidden();
        await expect(getLabels(page)).toHaveCount(6);
    });

    test('should confirm the caption without splitting the paragraph @wysiwyg', async ({
        page,
        editor,
    }) => {
        const paragraphs = editor.locators.contenteditable.locator('p');
        const count = await paragraphs.count();
        await getLabels(page).first().click();
        await getInput(page).fill('Ready');
        await page.keyboard.press('Enter');
        await expect(getPopup(page)).toBeHidden();
        await expect(paragraphs).toHaveCount(count);
        await expect(paragraphs.nth(1)).toHaveText('Before Ready after');
    });

    test('should return focus after clearing the caption with the keyboard @wysiwyg', async ({
        page,
    }) => {
        await getLabels(page).first().click();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');
        await expect(getInput(page)).toBeFocused();
        await expect(getInput(page)).toHaveValue('');
        await page.keyboard.type('Again');
        await expect(getInput(page)).toHaveValue('Again');
    });

    test('should refocus the caption on every explicit edit request @wysiwyg', async ({page}) => {
        await getLabels(page).first().click();
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Enter');
        await expect(getInput(page)).toBeFocused();
        await getPopup(page).getByLabel('Red', {exact: true}).click();
        await getLabels(page).first().click();
        await expect(getInput(page)).toBeFocused();
    });

    test('should close from a color with one Escape and keep typing outside @wysiwyg', async ({
        page,
        editor,
    }) => {
        await getLabels(page).first().click();
        await getPopup(page).getByLabel('Red', {exact: true}).focus();
        await page.keyboard.press('Escape');
        await expect(getPopup(page)).toBeHidden();
        await page.keyboard.type('Q');
        await expect(getLabels(page)).toHaveCount(7);
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
        await expect(getLabels(page)).toHaveCount(7);
        await expect(editor.locators.contenteditable.locator('p').nth(1)).toHaveText(
            'Before DraftQ after',
        );
    });

    test('should preserve brackets through a mode round trip @wysiwyg', async ({page, editor}) => {
        await getLabels(page).first().click();
        await getInput(page).fill('a [b] c');
        await page.keyboard.press('Escape');
        await editor.switchMode('markup');
        await editor.switchMode('wysiwyg');
        await expect(getLabels(page)).toHaveCount(7);
        await expect(getLabels(page).first()).toHaveText('a [b] c');
        await expect(getLabels(page).first()).toHaveAttribute('data-color', 'blue');
    });

    test('should preserve selected text and focus its inserted caption @wysiwyg', async ({
        page,
        editor,
    }) => {
        const line = editor.locators.contenteditable.locator('p').first();
        await line.click();
        await editor.press('Home');
        await editor.press('Shift+ArrowRight', 5);
        await page.getByRole('button', {name: 'Label', exact: true}).click();
        await expect(getInput(page)).toBeFocused();
        await expect(getInput(page)).toHaveValue('Plain');
        await page.keyboard.type('Ready');
        await expect(getInput(page)).toHaveValue('Ready');
        await expect(getLabels(page).first()).toHaveText('Ready');
    });

    test('should refresh page suggestions when another label changes @wysiwyg', async ({page}) => {
        await getLabels(page).first().click();
        const suggestions = getPopup(page).getByRole('group', {name: 'Labels on this page'});
        await expect(
            suggestions.getByRole('button', {name: 'Green, Green', exact: true}),
        ).toBeVisible();
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
        await expect(
            suggestions.getByRole('button', {name: 'Green, Green', exact: true}),
        ).toHaveCount(0);
        await expect(
            suggestions.getByRole('button', {name: 'Ready, Red', exact: true}),
        ).toBeVisible();
        await expect(getInput(page)).toHaveValue('Draft');
        await expect(getInput(page)).toBeFocused();
    });

    test('should reuse a page label and its color with keyboard navigation @wysiwyg', async ({
        page,
    }) => {
        await getLabels(page).first().click();
        const suggestions = getPopup(page).getByRole('group', {name: 'Labels on this page'});
        await expect(suggestions.getByRole('button')).toHaveCount(6);
        const green = suggestions.getByRole('button', {name: 'Green, Green', exact: true});
        await green.focus();
        await page.keyboard.press('ArrowDown');
        await expect(
            suggestions.getByRole('button', {name: 'Yellow, Yellow', exact: true}),
        ).toBeFocused();
        await page.keyboard.press('ArrowUp');
        await expect(green).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(getPopup(page)).toBeHidden();
        await expect(getLabels(page).first()).toHaveText('Green');
        await expect(getLabels(page).first()).toHaveAttribute('data-color', 'green');
        await expect(getLabels(page).nth(2)).toHaveText('Green');
        expect(await isEditorFocused(page)).toBe(true);
    });

    test('should update a long caption live without moving the left aligned popup @wysiwyg', async ({
        page,
    }) => {
        await getLabels(page).first().click();
        await page.locator('.g-md-label-popup').evaluate(async (element) => {
            await Promise.all(
                element.getAnimations({subtree: true}).map((animation) => animation.finished),
            );
        });
        const before = await getPopup(page).boundingBox();
        if (!before) throw new Error('Missing popup');
        const options = await getPopup(page)
            .getByRole('group', {name: 'Labels on this page'})
            .textContent();
        for (const text of [
            'A',
            'A longer caption with spaces',
            'A longer caption with spaces '.repeat(8),
        ]) {
            await getInput(page).fill(text);
            await expect(getLabels(page).first()).toHaveText(text);
            const after = await getPopup(page).boundingBox();
            if (!after) throw new Error('Missing popup after typing');
            expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(1);
            expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
            expect(
                await getPopup(page)
                    .getByRole('group', {name: 'Labels on this page'})
                    .textContent(),
            ).toBe(options);
        }
        await getPopup(page).getByLabel('Red', {exact: true}).click();
        await expect(getInput(page)).toHaveValue('A longer caption with spaces '.repeat(8));
        await expect(getLabels(page).first()).toHaveAttribute('data-color', 'red');
    });

    test('should focus the caption of an inserted label @wysiwyg', async ({page, editor}) => {
        await page.getByTestId('g-md-editor-mode').getByText('Plain line').click();
        await editor.press('End');
        await editor.press('Enter');
        await editor.selectFromCommandMenu('label', 'Label');

        await expect(getPopup(page)).toBeVisible();
        await expect(getInput(page)).toBeFocused();
        await expect(getInput(page)).toHaveValue('');
        await expect(
            getLabels(page).locator('.g-label__content[data-placeholder]'),
        ).toHaveAttribute('data-placeholder', 'Set status');
        await expect(getLabels(page)).toHaveCount(8);
    });
});

test.describe('Label, former markup', () => {
    test('should read the former status directive @wysiwyg', async ({mount, page, editor}) => {
        await mount(
            <Playground
                initial=":status[Old]{color=teal} text"
                width="100%"
                style={{width: 812}}
            />,
        );
        await editor.switchMode('wysiwyg');

        const labels = page
            .getByTestId('g-md-editor-mode')
            .locator('[contenteditable=true] .g-md-label');
        await expect(labels).toHaveCount(1);
        await expect(labels.first()).toHaveText('Old');
        await expect(labels.first()).toHaveAttribute('data-color', 'blue');
    });
});

test.describe('Label, palette of the table', () => {
    test('should use the swatch geometry of the table palette @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        const initial = dd`
            Before :label[Draft] after

            #|
            || one   | two  ||
            || three | four ||
            |#
        `;
        await mount(<Playground initial={initial} width="100%" style={{width: 812}} />);
        await page.setViewportSize({height: 500, width: 812});
        await editor.switchMode('wysiwyg');

        const contenteditable = editor.locators.contenteditable;
        await contenteditable.locator('.g-md-label').click();
        const labelPalette = page.locator('.g-md-label-tooltip .g-md-color-palette');
        await expect(labelPalette).toBeVisible();
        const label = await measureSelectedSwatch(labelPalette);
        await page.keyboard.press('Escape');

        const table = (await editor.yfmTable.getTable(contenteditable)).first();
        await editor.yfmTable.focusFirstCell(table);
        await (await editor.yfmTable.getCells(table)).first().hover();
        await (await editor.yfmTable.getRowButtons(table)).first().click();
        await editor.yfmTable.openCellBgPalette('row');
        const tablePalette = page.locator('.g-md-yfm-table-cell-bg-palette');
        const tableSwatch = await measureSelectedSwatch(tablePalette);

        expect(label).toEqual(tableSwatch);
        expect(Math.abs(label.offsetX)).toBeLessThanOrEqual(1);
        expect(Math.abs(label.offsetY)).toBeLessThanOrEqual(1);
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
        await content.locator('.g-md-label').click();
        await page.keyboard.press('Escape');
        await editor.press('ArrowRight', 2);
        await expect(content.locator('.fake-cursor')).toHaveCount(0);
        await page.keyboard.type('Q');
        await expect(content.locator('code')).toHaveText('cQode');
        await expect(content.locator('.g-md-label')).toHaveText('L');
    });

    test('should leave preceding code outside the mark @wysiwyg', async ({mount, page, editor}) => {
        await mount(<Playground initial="a `code`:label[L] z" width="100%" style={{width: 812}} />);
        await editor.switchMode('wysiwyg');
        const content = editor.locators.contenteditable;
        await content.locator('.g-md-label').click();
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
        await expect(page.locator('.playground__pm-selection')).toContainText('Cursor: 1');
        await editor.press('End');
        await expect(page.locator('.playground__pm-selection')).toContainText('Cursor: 14');
        for (let i = 0; i < 3; i++) {
            // Repeated clicks within 500 ms select words/paragraphs in ProseMirror.
            await editor.press('Control+Home');
            await expect(page.locator('.playground__pm-selection')).toContainText('Cursor: 1');
            await editor.press('End');
            await expect(page.locator('.playground__pm-selection')).toContainText('Cursor: 14');
            await editor.press('Home');
            await editor.press('ArrowDown');
            await expect(page.locator('.playground__pm-selection')).toContainText('Cursor: 16');
        }
    });
});
