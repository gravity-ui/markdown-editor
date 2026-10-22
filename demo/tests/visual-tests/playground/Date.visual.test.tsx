import type {Locator, Page} from '@playwright/test';
import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {LabelPlayground} from './Label.helpers';
import {Playground} from './Playground.helpers';

// Days of past months, so the mark of the current day does not appear in the calendar.
const markup = dd`
    Plain line of the paragraph text

    Before :date[2025-03-14] after

    :date[2024-02-29] :date[2025-12-31] :label[Planned]{color=blue} :date[2025-01-15]
`;

test.describe('Date', () => {
    test.beforeEach(async ({mount, page, editor}) => {
        await mount(<LabelPlayground initial={markup} />);
        await page.setViewportSize({height: 760, width: 812});
        await editor.switchMode('wysiwyg');
    });

    const getDates = (page: Page) =>
        page.getByTestId('g-md-editor-mode').locator('[contenteditable=true] .g-md-date');
    const getPopup = (page: Page) => page.locator('.g-md-date-tooltip');
    const getDay = (page: Page, day: number) =>
        getPopup(page).locator('[role=button]', {hasText: new RegExp(`^${day}$`)});
    const isEditorFocused = (page: Page) =>
        page.evaluate(() => document.activeElement?.getAttribute('contenteditable') === 'true');
    const isCalendarFocused = (page: Page) =>
        page.evaluate(() =>
            document.querySelector('.g-md-date-tooltip')?.contains(document.activeElement),
        );
    const expectCursor = (page: Page, pos: number) =>
        expect(page.locator('.playground__pm-selection')).toContainText(`Cursor: ${pos}`);

    /** Puts the cursor before the date of the second paragraph: `Before |[Mar 14, 2025] after`. */
    const placeCursorBeforeDate = async (
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
        await expectCursor(page, 42);
    };

    const clickOutside = async (page: Page) => {
        const point = await page.evaluate(() => {
            const editor = document.querySelector('[data-qa=g-md-editor-mode]');
            const popup = document.querySelector('.g-md-date-tooltip');
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

    const measure = (root: Locator) =>
        root.evaluate((element) => {
            // Geometry and typography of the UIKit Label, without the theme colors.
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
                    margin: textStyle.margin,
                    fontFamily: textStyle.fontFamily,
                    fontSize: textStyle.fontSize,
                    fontWeight: textStyle.fontWeight,
                    lineHeight: textStyle.lineHeight,
                };
            };

            const [plain, withDate] = Array.from(element.querySelectorAll('p'));
            const date = withDate.querySelector('.g-md-date') as HTMLElement;
            const dateRect = date.getBoundingClientRect();
            const lineRect = withDate.getBoundingClientRect();

            return {
                plainHeight: plain.getBoundingClientRect().height,
                lineHeightWithDate: lineRect.height,
                dateTopGap: dateRect.top - lineRect.top,
                dateBottomGap: lineRect.bottom - dateRect.bottom,
                dateStyle: getLabelStyle(date),
                labelStyle: getLabelStyle(element.querySelector('.g-md-label') as HTMLElement),
                nativeStyle: getLabelStyle(document.querySelector('.native-label') as HTMLElement),
                texts: Array.from(element.querySelectorAll('.g-md-date')).map(
                    (node) => node.textContent,
                ),
            };
        });

    const expectDateMetrics = (metrics: Awaited<ReturnType<typeof measure>>) => {
        expect(metrics.texts).toEqual([
            'Mar 14, 2025',
            'Feb 29, 2024',
            'Dec 31, 2025',
            'Jan 15, 2025',
        ]);
        expect(metrics.lineHeightWithDate).toBe(metrics.plainHeight);
        expect(metrics.dateTopGap).toBeGreaterThanOrEqual(0);
        expect(metrics.dateBottomGap).toBeGreaterThanOrEqual(0);
        // The date and the label keep the look of the UIKit Label of the same size.
        expect(metrics.dateStyle).toEqual(metrics.nativeStyle);
        expect(metrics.labelStyle).toEqual(metrics.nativeStyle);
        expect(metrics.dateStyle.height).toBe(20);
    };

    test('should render dates in the WYSIWYG mode @wysiwyg', async ({editor, expectScreenshot}) => {
        expectDateMetrics(await measure(editor.locators.contenteditable));

        await expectScreenshot();
    });

    test('should render dates in the preview @markup', async ({
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
        await expect(preview.locator('time.g-md-date')).toHaveCount(4);
        expectDateMetrics(await measure(preview));

        await expectScreenshot({component: preview});
    });

    test('should open the popover on arrows without moving the focus @wysiwyg', async ({
        page,
        editor,
        expectScreenshot,
    }) => {
        await placeCursorBeforeDate(page, editor);

        const contenteditable = editor.locators.contenteditable;
        await expect(contenteditable).toHaveClass(/no-cursor/);
        await expect(contenteditable.locator('.fake-cursor')).toHaveCount(1);
        await expect(getPopup(page)).toBeHidden();

        await editor.press('ArrowRight');
        await expect(getPopup(page)).toBeVisible();
        await expect(getPopup(page).locator('[aria-selected=true]')).toHaveText('14');
        expect(await isEditorFocused(page)).toBe(true);

        await expectScreenshot({nameSuffix: 'passive popover', fullPage: true});

        await editor.press('ArrowRight');
        await expect(getPopup(page)).toBeHidden();
        await expect(contenteditable.locator('.fake-cursor')).toHaveCount(1);

        await editor.pressSequentially('X');
        await expect(contenteditable.locator('p').nth(1)).toHaveText('Before Mar 14, 2025X after');

        await expectCursor(page, 44);
        await editor.press('ArrowLeft');
        await expectCursor(page, 43);
        await expect(contenteditable.locator('.fake-cursor')).toHaveCount(1);
        await editor.press('ArrowLeft');
        await expect(getPopup(page)).toBeVisible();
        await editor.press('ArrowLeft');
        await expect(getPopup(page)).toBeHidden();

        await editor.pressSequentially('Y');
        await expect(contenteditable.locator('p').nth(1)).toHaveText('Before YMar 14, 2025X after');
        await expect(getDates(page).first()).toHaveAttribute('datetime', '2025-03-14');
        expect(await isEditorFocused(page)).toBe(true);
    });

    test('should close the passive popover on Escape without reopening @wysiwyg', async ({
        page,
        editor,
        wait,
    }) => {
        await placeCursorBeforeDate(page, editor);
        await editor.press('ArrowRight');
        await expect(getPopup(page)).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(getPopup(page)).toBeHidden();
        await wait.timeout(500);
        await expect(getPopup(page)).toBeHidden();
        expect(await isEditorFocused(page)).toBe(true);
        // Closing returns a text caret after the date, as for a label.
        await expectCursor(page, 43);
    });

    test('should choose a day in the calendar after a click @wysiwyg', async ({
        page,
        wait,
        expectScreenshot,
    }) => {
        await getDates(page).first().click();

        await expect(getPopup(page)).toBeVisible();
        await expect.poll(() => isCalendarFocused(page)).toBe(true);
        await expect(getPopup(page).locator('[aria-selected=true]')).toHaveText('14');

        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        await expectScreenshot({nameSuffix: 'edit popover', fullPage: true});

        await getDay(page, 20).click();
        await expect(getPopup(page)).toBeHidden();
        await expect(getDates(page).first()).toHaveAttribute('datetime', '2025-03-20');
        await expect(getDates(page).first()).toHaveText('Mar 20, 2025');
        await expect(getDates(page)).toHaveCount(4);
        await wait.markupPreview('Before :date[2025-03-20] after');
        expect(await isEditorFocused(page)).toBe(true);
        await expectCursor(page, 43);
    });

    test('should choose a day with the keyboard after Enter @wysiwyg', async ({
        page,
        editor,
        wait,
    }) => {
        const paragraphCount = await editor.locators.contenteditable.locator('p').count();
        await placeCursorBeforeDate(page, editor);
        await editor.press('ArrowRight');
        await editor.press('Enter');
        await expect.poll(() => isCalendarFocused(page)).toBe(true);

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        await expect(getPopup(page)).toBeHidden();
        await expect(getDates(page).first()).toHaveAttribute('datetime', '2025-03-15');
        await expect(editor.locators.contenteditable.locator('p')).toHaveCount(paragraphCount);
        await wait.markupPreview('Before :date[2025-03-15] after');
        expect(await isEditorFocused(page)).toBe(true);
    });

    test('should close the calendar on Escape and keep the date @wysiwyg', async ({page, wait}) => {
        await getDates(page).first().click();
        await expect.poll(() => isCalendarFocused(page)).toBe(true);

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Escape');
        await expect(getPopup(page)).toBeHidden();
        await wait.timeout(500);
        await expect(getPopup(page)).toBeHidden();
        expect(await isEditorFocused(page)).toBe(true);
        await expectCursor(page, 43);
        await expect(getDates(page).first()).toHaveAttribute('datetime', '2025-03-14');
    });

    test('should close the popover on an outside click @wysiwyg', async ({page, wait}) => {
        await getDates(page).first().click();
        await expect(getPopup(page)).toBeVisible();

        await clickOutside(page);
        await expect(getPopup(page)).toBeHidden();
        await wait.timeout(500);
        await expect(getPopup(page)).toBeHidden();
        await expect(getDates(page).first()).toHaveAttribute('datetime', '2025-03-14');

        await getDates(page).first().click();
        await expect(getPopup(page)).toBeVisible();
    });

    test('should refocus the calendar on a repeated explicit edit @wysiwyg', async ({
        page,
        editor,
    }) => {
        await getDates(page).first().click();
        await expect.poll(() => isCalendarFocused(page)).toBe(true);
        await editor.locators.contenteditable.focus();
        await editor.press('Enter');
        await expect.poll(() => isCalendarFocused(page)).toBe(true);
    });

    test('should preserve a passively selected date when typing @wysiwyg', async ({
        page,
        editor,
    }) => {
        await placeCursorBeforeDate(page, editor);
        await editor.press('ArrowRight');
        await page.keyboard.type('Q');
        await expect(getDates(page)).toHaveCount(4);
        await expect(getDates(page).first()).toHaveAttribute('datetime', '2025-03-14');
        await expect(editor.locators.contenteditable.locator('p').nth(1)).toHaveText(
            'Before Mar 14, 2025Q after',
        );
    });

    test('should keep dates after switching the modes @wysiwyg', async ({page, editor, wait}) => {
        await editor.switchMode('markup');
        await editor.switchMode('wysiwyg');

        await expect(getDates(page)).toHaveCount(4);
        await wait.markupPreview(':date[2024-02-29] :date[2025-12-31]');
        await wait.markupPreview(':date[2025-01-15]');
    });
});

test.describe('Date, insertion', () => {
    test('should insert the current day and focus the calendar @wysiwyg', async ({
        mount,
        page,
        editor,
    }) => {
        await page.clock.setFixedTime(new Date(2026, 9, 21, 23, 30));
        await mount(<Playground initial="Plain line" width="100%" style={{width: 812}} />);
        await editor.switchMode('wysiwyg');

        await page.getByTestId('g-md-editor-mode').getByText('Plain line').click();
        await editor.press('End');
        await editor.press('Enter');
        await editor.selectFromCommandMenu('date', 'Date');

        const popup = page.locator('.g-md-date-tooltip');
        await expect(popup).toBeVisible();
        await expect(popup.locator('[aria-selected=true]')).toHaveText('21');
        await expect
            .poll(() =>
                page.evaluate(() =>
                    document.querySelector('.g-md-date-tooltip')?.contains(document.activeElement),
                ),
            )
            .toBe(true);

        const dates = editor.locators.contenteditable.locator('.g-md-date');
        await expect(dates).toHaveCount(1);
        await expect(dates.first()).toHaveAttribute('datetime', '2026-10-21');
    });

    test('should keep an invalid day as plain text @wysiwyg', async ({mount, editor}) => {
        await mount(<Playground initial=":date[2026-02-30]" width="100%" style={{width: 812}} />);
        await editor.switchMode('wysiwyg');

        await expect(editor.locators.contenteditable.locator('.g-md-date')).toHaveCount(0);
        await expect(editor.locators.contenteditable).toContainText(':date[2026-02-30]');
    });
});
