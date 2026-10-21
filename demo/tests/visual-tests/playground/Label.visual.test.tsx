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
        const center = (rect: DOMRect) => ({
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
        });

        return {
            item: {width: itemRect.width, height: itemRect.height},
            itemPadding: getComputedStyle(item).padding,
            itemRadius: getComputedStyle(item).borderRadius,
            swatch: {width: swatchRect.width, height: swatchRect.height},
            swatchBorder: swatchStyle.borderTopWidth,
            swatchRadius: swatchStyle.borderRadius,
            check: {width: checkRect.width, height: checkRect.height},
            offsetX: center(checkRect).x - center(swatchRect).x,
            offsetY: center(checkRect).y - center(swatchRect).y,
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

        await editor.press('ArrowRight');
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
                for (let y = window.innerHeight - 2; y > 0; y -= 10) {
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

    test('should focus the caption of an inserted label @wysiwyg', async ({page, editor}) => {
        await page.getByTestId('g-md-editor-mode').getByText('Plain line').click();
        await editor.press('End');
        await editor.press('Enter');
        await editor.selectFromCommandMenu('label', 'Label');

        await expect(getPopup(page)).toBeVisible();
        await expect(getInput(page)).toBeFocused();
        await expect(getInput(page)).toHaveValue('Label');
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
