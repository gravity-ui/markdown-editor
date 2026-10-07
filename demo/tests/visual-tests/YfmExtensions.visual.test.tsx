import {expect, test} from 'playwright/core';

import {YFMStories} from './YfmExtensions.helpers';

test.describe('Extensions, YFM', () => {
    test('Task lists', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.Tasklist />);
        await expectScreenshot();
    });
    test('Folding Headings', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.FoldingHeadings />);
        await expectScreenshot();
    });
    test('YFM Notes', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.YfmNote />);
        await expectScreenshot();
    });
    test('YFM Cut', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.YfmCut />);
        await expectScreenshot();
    });
    test('YFM Tabs', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.YfmTabs />);
        await expectScreenshot();
    });
    // TODO: investigate and fix, unskip after fixing
    //  Now screenshot in .playground__preview has text cut off (as if overlapped);
    test.skip('YFM HTML', async ({mount, expectScreenshot, page}) => {
        await mount(<YFMStories.YfmHtmlBlock />);

        await page.waitForTimeout(2000);
        await expectScreenshot();
    });
    test('should switch HTML block between visual and code editing', async ({mount, page}) => {
        await mount(<YFMStories.YfmHtmlBlock initial={'::: html\n<p>Initial</p>\n:::'} />);

        const block = page.locator('.g-md-yfm-html-block');
        const toolbar = block.locator('.g-md-yfm-html-block__toolbar');
        const modes = toolbar.getByRole('radiogroup', {name: 'View mode'});
        const visual = modes.getByRole('radio', {name: 'Visual'});
        const code = modes.getByRole('radio', {name: 'Code'});
        await expect(visual).toBeChecked();
        await expect(code).not.toBeChecked();
        await expect(toolbar.getByRole('button', {name: 'Remove'})).toBeVisible();
        await expect(toolbar).toHaveScreenshot('html-block-toolbar.png');
        await expect(
            block.getByText(
                'Select text or an image in the block to edit its text and attributes.',
            ),
        ).toBeVisible();

        const preview = block.frameLocator('iframe').locator('p');
        await preview.dblclick();
        await expect(block.getByRole('textbox', {name: 'HTML', exact: true})).toHaveCount(0);
        const cancel = toolbar.getByRole('button', {name: 'Cancel'});
        if (await cancel.isVisible()) await cancel.click();

        await code.check();
        const source = block.getByRole('textbox', {name: 'HTML', exact: true});
        await expect(source).toBeVisible();
        await expect(block.locator('.g-md-yfm-html-block__code-body')).toHaveScreenshot(
            'html-block-code.png',
        );
        await expect(block).toHaveScreenshot('html-block-code-layout.png');
        await expect(visual).not.toBeChecked();
        await expect(code).toBeChecked();
        await source.fill('<p>Discarded from editor</p>');
        await cancel.click();
        await expect(visual).toBeChecked();
        await expect(preview).toHaveText('Initial');

        await code.check();
        await source.fill('<p>Updated</p>');
        await visual.check();
        await expect(preview).toHaveText('Updated');
        await expect(visual).toBeChecked();
        await expect(code).not.toBeChecked();

        await code.check();
        await source.fill('<p>Saved with toolbar</p>');
        await toolbar.getByRole('button', {name: 'Save', exact: true}).click();
        await expect(preview).toHaveText('Saved with toolbar');
        await toolbar.getByRole('button', {name: 'Remove'}).click();
        await expect(block).toHaveCount(0);
    });
    test('should offer inline editing in the HTML block story', async ({mount, page}) => {
        await mount(<YFMStories.YfmHtmlBlock />);

        const block = page.locator('.g-md-yfm-html-block').first();
        await expect(block.getByRole('radio', {name: 'Visual'})).toBeChecked();
        const image = block.frameLocator('iframe').locator('img.html-block-demo-image');
        await expect(image).toBeVisible();
        await expect
            .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
            .toBe(557);
        const imageWidthRatio = await image.evaluate(
            (element) =>
                element.getBoundingClientRect().width /
                element.ownerDocument.body.getBoundingClientRect().width,
        );
        expect(imageWidthRatio).toBeCloseTo(1 / 3, 2);
        await page.evaluate(() => window.scrollTo(0, 150));
        const heading = block.frameLocator('iframe').locator('h1');
        await heading.hover();
        const editButton = block.getByRole('button', {name: 'Edit element'});
        await editButton.hover();
        await expect(editButton).toBeVisible();
        await expect(editButton).toHaveCSS('background-color', 'rgb(255, 255, 255)');
        await expect(editButton).toHaveScreenshot('html-block-edit-button.png');
        expect(
            await editButton.evaluate((button) => {
                const rect = button.getBoundingClientRect();
                return button.contains(
                    document.elementFromPoint(
                        rect.left + rect.width / 2,
                        rect.top + rect.height / 2,
                    ),
                );
            }),
        ).toBe(true);
        const scrollBefore = await page.evaluate(() => window.scrollY);
        expect(scrollBefore).toBeGreaterThan(0);
        await editButton.click();
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollBefore);

        const panel = block.getByRole('region', {name: 'Edit element <h1>'});
        const toolbar = block.locator('.g-md-yfm-html-block__toolbar');
        await expect(panel.getByRole('textbox', {name: 'Text'})).toBeFocused();
        await expect(toolbar.getByRole('button', {name: 'Save', exact: true})).toBeDisabled();
        await expect(toolbar.getByRole('radio', {name: 'Code'})).toBeDisabled();
        await toolbar.getByRole('button', {name: 'Cancel'}).click();
        await expect(panel).toHaveCount(0);

        await heading.hover();
        await editButton.click();
        await panel.getByRole('button', {name: /Attributes/}).click();
        await panel.getByRole('button', {name: 'Add attribute'}).click();
        const attributeName = panel.getByRole('textbox', {name: 'Name', exact: true}).last();
        await expect(attributeName).toBeFocused();
        await attributeName.fill('title');
        await panel.getByRole('textbox', {name: 'Value: title'}).fill('Edited');
        await panel.getByRole('textbox', {name: 'Text'}).fill('Updated heading');
        await toolbar.getByRole('button', {name: 'Save', exact: true}).click();
        await expect(heading).toHaveText('Updated heading');
        await expect(heading).toHaveAttribute('title', 'Edited');
        await expect(toolbar.getByRole('radio', {name: 'Code'})).toBeEnabled();
        await expect
            .poll(() =>
                block
                    .frameLocator('iframe')
                    .locator('body')
                    .evaluate(
                        (body) =>
                            body.scrollHeight - body.ownerDocument.documentElement.clientHeight,
                    ),
            )
            .toBeLessThanOrEqual(0);
    });
    test('should group element properties and actions within the HTML block', async ({
        mount,
        page,
    }) => {
        await mount(
            <YFMStories.YfmHtmlBlock
                initial={'::: html\n<p title="Greeting">Initial</p>\n<hr class="divider">\n:::'}
            />,
        );
        const block = page.locator('.g-md-yfm-html-block');
        const preview = block.frameLocator('iframe');
        const paragraph = preview.locator('p');
        const toolbar = block.locator('.g-md-yfm-html-block__toolbar');
        const panel = block.getByRole('region', {name: /Edit element/});
        const save = toolbar.getByRole('button', {name: 'Save', exact: true});

        await paragraph.click();
        await expect(panel).toContainText('<p>');
        const text = panel.getByRole('textbox', {name: 'Text'});
        await expect(text).toBeFocused();
        await panel.getByRole('button', {name: /Attributes/}).click();
        await expect(panel).toContainText('HTML attributes control links, images and appearance.');
        await expect(block).toHaveScreenshot('html-block-element-panel.png');
        await text.fill('Discarded');
        await toolbar.getByRole('button', {name: 'Cancel'}).press('Enter');
        await expect(paragraph).toHaveText('Initial');

        await paragraph.click();
        await text.fill('Updated');
        await panel.getByRole('button', {name: /Attributes/}).click();
        const name = panel.getByRole('textbox', {name: 'Name', exact: true});
        await name.fill('invalid name');
        await save.click();
        await expect(panel.getByRole('alert')).toContainText('Invalid attribute name');
        await expect(paragraph).toHaveText('Initial');
        await name.fill('title');
        await panel.getByRole('textbox', {name: 'Value: title'}).fill('Updated title');
        await save.click();
        await expect(paragraph).toHaveText('Updated');
        await expect(paragraph).toHaveAttribute('title', 'Updated title');

        await preview.locator('hr').click();
        await expect(panel).toContainText('<hr>');
        await expect(panel.getByRole('textbox', {name: 'Text'})).toHaveCount(0);
        const classValue = panel.getByRole('textbox', {name: 'Value: class'});
        await expect(classValue).toBeVisible();
        await classValue.fill('updated-divider');
        await classValue.press('Enter');
        await expect(preview.locator('hr')).toHaveAttribute('class', 'updated-divider');

        await paragraph.click();
        await text.fill('Discarded with Escape');
        await text.press('Escape');
        await expect(panel).toHaveCount(0);
        await expect(paragraph).toHaveText('Updated');
    });
    test('should keep HTML block controls within a narrow viewport', async ({mount, page}) => {
        await page.setViewportSize({width: 480, height: 800});
        await mount(
            <YFMStories.YfmHtmlBlock initial={'::: html\n<p title="Greeting">Initial</p>\n:::'} />,
        );
        const block = page.locator('.g-md-yfm-html-block');
        await block.frameLocator('iframe').locator('p').click();
        await block.getByRole('button', {name: /Attributes/}).click();
        await expect(block).toHaveScreenshot('html-block-element-panel-narrow.png');
        expect(
            await block.evaluate((element) => element.scrollWidth - element.clientWidth),
        ).toBeLessThanOrEqual(2);
        await expect(block.getByRole('button', {name: 'Cancel'})).toBeVisible();
        await expect(block.getByRole('button', {name: 'Save', exact: true})).toBeVisible();
        await expect(block.getByRole('button', {name: 'Remove', exact: true})).toBeVisible();
    });
    test('YFM File', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.YfmFile />);
        await expectScreenshot();
    });
    test('YFM Table', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.YfmTable />);
        await expectScreenshot();
    });
    test('LaTeX Formulas', async ({mount, expectScreenshot, wait}) => {
        await mount(<YFMStories.LaTeXFormulas />);
        await wait.loadersHidden();

        await expectScreenshot();
    });
    test('Mermaid diagram', async ({mount, expectScreenshot, wait}) => {
        await mount(<YFMStories.MermaidDiagram />);
        await wait.loadersHidden();

        await expectScreenshot();
    });
    test('YFM Page Constructor', async ({mount, expectScreenshot, wait}) => {
        await mount(<YFMStories.YfmPageConstructor />);
        await wait.loadersHidden();

        await expectScreenshot();
    });
});
