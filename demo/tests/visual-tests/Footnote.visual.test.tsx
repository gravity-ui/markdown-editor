import {expect, test} from 'playwright/core';

import {footnoteEditorMarkup, footnoteExamples} from '../../src/stories/examples/footnote/markup';

import {
    FootnoteCatalogueCheck,
    FootnoteEditor,
    FootnoteLiveEditor,
    FootnotePreview,
} from './Footnote.helpers';

test.describe('Footnote', () => {
    for (const theme of ['light', 'dark'] as const) {
        test(`should display markers and a keyboard tooltip in ${theme} theme`, async ({
            mount,
            page,
            expectScreenshot,
        }) => {
            await mount(<FootnoteEditor theme={theme} />);
            const markers = page.locator('.ProseMirror .g-md-footnote__marker');
            await expect(markers).toHaveText(['*', 'selected phrase', '*']);
            await markers.first().focus();
            const tooltip = page.getByRole('tooltip');
            await expect(tooltip).toBeVisible();
            await expect(tooltip.locator('strong')).toHaveText('Formatted');
            await expect(tooltip.getByRole('link')).toHaveAttribute('href', 'https://example.com');
            const id = await tooltip.getAttribute('id');
            await expect(markers.first()).toHaveAttribute('aria-describedby', id ?? '');
            await expectScreenshot({fullPage: true, themes: [theme]});
            await markers.first().press('Escape');
            await expect(tooltip).toBeHidden();
        });

        test(`should edit a footnote in ${theme} theme`, async ({
            mount,
            page,
            expectScreenshot,
        }) => {
            await mount(<FootnoteEditor theme={theme} />);
            await page.locator('.ProseMirror .g-md-footnote__marker').nth(1).click();
            const form = page.locator('.g-md-footnote-editor');
            await expect(form).toBeVisible();
            await form.locator('textarea').fill('**Updated** note');
            await expectScreenshot({fullPage: true, themes: [theme]});
            await form.getByRole('button', {name: /Save|Сохранить/}).click();
            await expect(form).toBeHidden();
            await page.getByRole('button', {name: 'Save document'}).click();
            await expect(page.getByTestId('footnote-markup')).toContainText(
                '[*custom]: **Updated** note',
            );
        });
    }

    test('should insert a footnote from the slash menu', async ({mount, page}) => {
        await mount(<FootnoteEditor markup="" />);
        const editor = page.locator('.ProseMirror');
        await editor.pressSequentially('/footnote');
        await page.getByText(/^(Footnote|Сноска)$/).click();
        const form = page.locator('.g-md-footnote-editor');
        await expect(form).toBeVisible();
        await expect(form.locator('input')).toHaveValue('*');
        await form.locator('textarea').fill('Inserted note');
        await form.getByRole('button', {name: /Save|Сохранить/}).click();
        await page.getByRole('button', {name: 'Save document'}).click();
        await expect(page.getByTestId('footnote-markup')).toContainText('[*](*footnote-1)');
        await expect(page.getByTestId('footnote-markup')).toContainText(
            '[*footnote-1]: Inserted note',
        );
    });

    test('should keep the popup next to its marker when opening in a scrolled document', async ({
        mount,
        page,
    }) => {
        await mount(<FootnoteEditor />, {rootStyle: {paddingTop: 1200, paddingBottom: 1200}});
        const marker = page.locator('.ProseMirror .g-md-footnote__marker').nth(1);
        await marker.scrollIntoViewIfNeeded();
        const scrollY = await page.evaluate(() => window.scrollY);
        expect(scrollY).toBeGreaterThan(0);
        await marker.click();
        const form = page.locator('.g-md-footnote-editor');
        await expect(form.locator('textarea')).toBeFocused();
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollY);
        await expect
            .poll(async () => {
                const anchor = await marker.boundingBox();
                const popup = await form.boundingBox();
                if (!anchor || !popup) return Infinity;
                return Math.min(
                    Math.abs(popup.y - anchor.y - anchor.height),
                    Math.abs(anchor.y - popup.y - popup.height),
                );
            })
            .toBeLessThan(20);
    });

    test('should cancel a new footnote without leaving a reference or definition', async ({
        mount,
        page,
    }) => {
        await mount(<FootnoteEditor markup="" />);
        await page.locator('.ProseMirror').pressSequentially('/footnote');
        await page.getByText(/^(Footnote|Сноска)$/).click();
        const form = page.locator('.g-md-footnote-editor');
        await form.getByRole('button', {name: /Cancel|Отменить/}).click();
        await expect(page.locator('.ProseMirror .g-md-footnote')).toHaveCount(0);
        await page.getByRole('button', {name: 'Save document'}).click();
        await expect(page.getByTestId('footnote-markup')).toHaveText('');
    });

    test('should open shared native terms in preview with Enter and click', async ({
        mount,
        page,
    }) => {
        await mount(<FootnotePreview />);
        const terms = page.locator('.yfm-term_title');
        await expect(terms).toHaveText(['*', 'term']);
        await expect(terms.first()).toHaveCSS('vertical-align', 'super');
        await expect(terms.last()).toHaveCSS('vertical-align', 'super');
        const definition = page.locator('.yfm-term_dfn');
        await expect(definition).toBeHidden();
        await terms.first().focus();
        await terms.first().press('Enter');
        await expect(definition).toBeVisible();
        await expect(definition.locator('strong')).toHaveText('Shared');
        await page.keyboard.press('Escape');
        await expect(definition).toBeHidden();
        await expect(terms.first()).toBeFocused();
        await terms.last().click();
        await expect(definition).toBeVisible();
    });

    test('should close a hovered tooltip with Escape and include the text in print', async ({
        mount,
        page,
    }) => {
        await mount(<FootnoteEditor />);
        await page.locator('.ProseMirror .g-md-footnote__marker').first().hover();
        const tooltip = page.getByRole('tooltip');
        await expect(tooltip).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(tooltip).toBeHidden();
        await page.emulateMedia({media: 'print'});
        await expect(page.locator('.ProseMirror .g-md-footnote__content').first()).toBeVisible();
    });
});

/** Nested references inside a definition are not separate nodes in the editor. */
const countOutsideDefinitions = (elements: Element[]) =>
    elements.filter((element) => !element.closest('dfn')).length;

test.describe('Footnote catalogue', () => {
    const examples = Object.values(footnoteExamples).flatMap((group) => Object.entries(group));

    test('should use unique definition keys across the catalogue', () => {
        const keys = examples.flatMap(([, markup]) => [
            ...new Set([...markup.matchAll(/^\[\*([^\]]+)\]:/gm)].map((match) => match[1])),
        ]);
        expect(new Set(keys).size).toBe(keys.length);
    });

    test('should match native terms and keep the markup of every example in WYSIWYG', async ({
        mount,
        page,
    }) => {
        await mount(<FootnoteCatalogueCheck />);
        const cards = page.getByTestId('footnote-example');
        await expect(cards).toHaveCount(examples.length);
        for (const [index, [name, markup]] of examples.entries()) {
            const nativeTerms = await cards
                .nth(index)
                .locator('.yfm-term_title')
                .evaluateAll(countOutsideDefinitions);
            const result = await page.evaluate((value) => {
                const editor = window.mdEditor!;
                editor.replace(value);
                const notes = document.querySelectorAll('.ProseMirror .g-md-footnote');
                const unresolved = document.querySelectorAll(
                    '.ProseMirror .g-md-footnote_unresolved',
                );
                return {
                    markup: editor.getValue(),
                    resolved: notes.length - unresolved.length,
                };
            }, markup);
            expect(result.markup, name).toBe(markup);
            expect(result.resolved, name).toBe(nativeTerms);
        }
    });

    test('should open nested native definitions in the catalogue', async ({mount, page}) => {
        await mount(<FootnoteCatalogueCheck group="Explanation Markdown" />);
        const card = page.getByTestId('footnote-example').filter({hasText: 'Nested reference'});
        await card.locator('.yfm-term_title').first().click();
        const outer = page.locator('[id=":md-api_element"]');
        await expect(outer).toBeVisible();
        await outer.locator('.yfm-term_title').click();
        await expect(page.locator('[id=":md-gateway_element"]')).toBeVisible();
    });

    for (const theme of ['light', 'dark'] as const) {
        test(`should display the basic group with an open definition in ${theme} theme`, async ({
            mount,
            page,
            expectScreenshot,
        }) => {
            await mount(<FootnoteCatalogueCheck group="Basic" />);
            await page.locator('.yfm-term_title').first().click();
            await expect(page.locator('[id=":basic-rate_element"]')).toBeVisible();
            await expectScreenshot({
                component: page.locator('.footnote-catalogue'),
                themes: [theme],
            });
        });
    }

    for (const theme of ['light', 'dark'] as const) {
        test(`should display nested and missing definitions in WYSIWYG in ${theme} theme`, async ({
            mount,
            page,
            expectScreenshot,
        }) => {
            const markup = [
                footnoteExamples['Explanation Markdown']['Nested reference'],
                footnoteExamples['Edge cases']['Reference without a definition'],
            ].join('\n\n');
            await mount(<FootnoteEditor theme={theme} markup={markup} />);
            const markers = page.locator('.ProseMirror .g-md-footnote__marker');
            await markers.first().focus();
            const tooltip = page.getByRole('tooltip').filter({visible: true});
            await expect(tooltip.locator('.g-md-footnote__term')).toHaveText('gateway');
            await expectScreenshot({fullPage: true, themes: [theme]});
            await markers.last().focus();
            await expect(tooltip).toHaveText(/no definition/);
        });
    }

    test('should keep the markup after editing a footnote in the live editor', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(<FootnoteLiveEditor />);
        await expect
            .poll(() =>
                editor.locators.previewContent
                    .locator('.yfm-term_title')
                    .evaluateAll(countOutsideDefinitions),
            )
            .toBe(9);
        await editor.switchMode('wysiwyg');
        const notes = page.locator('.ProseMirror .g-md-footnote');
        await expect(notes).toHaveCount(10);
        await expect(page.locator('.ProseMirror .g-md-footnote_unresolved')).toHaveCount(1);
        await notes.filter({hasText: 'release notes'}).locator('button').click();
        const form = page.locator('.g-md-footnote-editor');
        await form.locator('textarea').fill('The notes list **every** change.');
        await form.getByRole('button', {name: /Save|Сохранить/}).click();
        await editor.switchMode('markup');
        const value = await page.evaluate(() => window.mdEditor!.getValue());
        expect(value).toBe(
            footnoteEditorMarkup.replace(
                '[*basic-notes]: The notes list every change in this version.',
                '[*basic-notes]: The notes list **every** change.',
            ),
        );
    });

    test('should open the form with Enter and return focus on Escape', async ({mount, page}) => {
        await mount(<FootnoteEditor markup={'A[*](*key)b\n\n[*key]: Text'} />);
        const editor = page.locator('.ProseMirror');
        await editor.click();
        // The editor focuses itself after mounting, which can reset an early selection.
        await expect(async () => {
            await editor.press('End');
            await editor.press('ArrowLeft');
            await editor.press('ArrowLeft');
            await expect(page.locator('.g-md-footnote_selected')).toBeVisible({timeout: 1000});
        }).toPass();
        await expect(page.getByRole('tooltip')).toBeVisible();
        const form = page.locator('.g-md-footnote-editor');
        await expect(form).toBeHidden();
        await editor.press('Enter');
        await expect(form.locator('textarea')).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(form).toBeHidden();
        await expect(editor).toBeFocused();
        await page.getByRole('button', {name: 'Save document'}).click();
        await expect(page.getByTestId('footnote-markup')).toHaveText('A[*](*key)b\n\n[*key]: Text');
    });
});
