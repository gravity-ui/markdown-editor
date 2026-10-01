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
    test('should switch HTML block between preview and code', async ({mount, page}) => {
        await mount(<YFMStories.YfmHtmlBlock initial={'::: html\n<p>Initial</p>\n:::'} />);

        const block = page.locator('.g-md-yfm-html-block');
        await block.hover();
        const toolbar = block.locator('.g-md-yfm-html-block__toolbar');
        await expect(toolbar).toHaveCSS('opacity', '1');

        const modes = toolbar.getByRole('radiogroup', {name: 'View mode'});
        await expect(modes.getByRole('radio', {name: 'Preview'})).toBeChecked();
        await expect(modes.getByRole('radio', {name: 'Editor'})).toBeDisabled();
        await expect(toolbar.getByRole('button', {name: 'Remove'})).toBeVisible();
        await modes.getByTitle('Code').click();

        await expect(block.locator('textarea')).toBeVisible();
        await block.locator('textarea').fill('<p>Updated</p>');
        await block.hover();
        await modes.getByTitle('Preview').click();

        const preview = block.frameLocator('iframe').locator('p');
        await expect(preview).toHaveText('Updated');
        await preview.dblclick();
        await expect(block.locator('textarea')).toBeVisible();
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
