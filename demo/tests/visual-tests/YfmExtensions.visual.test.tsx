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
        await block.hover();
        const toolbar = block.locator('.g-md-yfm-html-block__toolbar');
        await expect(toolbar).toHaveCSS('opacity', '1');
        await expect(toolbar).toHaveScreenshot('html-block-toolbar.png');

        const modes = toolbar.getByRole('group', {name: 'View mode'});
        const editor = modes.getByRole('button', {name: 'Editor'});
        const code = modes.getByRole('button', {name: 'Code'});
        await expect(editor).toHaveAttribute('aria-pressed', 'true');
        await expect(code).toHaveAttribute('aria-pressed', 'false');
        await expect(modes.getByRole('button', {name: 'Preview'})).toHaveCount(0);
        await expect(toolbar.getByRole('button', {name: 'Remove'})).toBeVisible();

        const preview = block.frameLocator('iframe').locator('p');
        await preview.dblclick();
        await expect(block.locator('textarea')).toHaveCount(0);
        await code.click();
        await expect(block.locator('textarea')).toBeVisible();
        await expect(block.locator('.g-md-yfm-html-block__code-body')).toHaveScreenshot(
            'html-block-code.png',
        );
        await expect(block.getByText('Code', {exact: true})).toBeVisible();
        await expect(block).toHaveCSS('border-top-width', '1px');
        await expect(editor).toHaveAttribute('aria-pressed', 'false');
        await expect(code).toHaveAttribute('aria-pressed', 'true');
        await block.locator('textarea').fill('<p>Discarded from editor</p>');
        await block.getByRole('button', {name: 'Cancel'}).click();
        await expect(block.getByText('Editor', {exact: true})).toBeVisible();
        await expect(editor).toHaveAttribute('aria-pressed', 'true');
        await expect(preview).toHaveText('Initial');

        await block.hover();
        await code.click();

        await expect(block.locator('textarea')).toBeVisible();
        await block.locator('textarea').fill('<p>Updated</p>');
        await editor.click();

        await expect(preview).toHaveText('Updated');
        await expect(editor).toHaveAttribute('aria-pressed', 'true');
        await expect(code).toHaveAttribute('aria-pressed', 'false');
    });
    test('should open HTML source on double-click when enabled', async ({mount, page}) => {
        await mount(
            <YFMStories.YfmHtmlBlock
                initial={'::: html\n<p>Initial</p>\n:::'}
                storyAdditionalControls={{yfmHtmlBlockOpenCodeOnDoubleClick: true}}
            />,
        );

        const block = page.locator('.g-md-yfm-html-block');
        await block.frameLocator('iframe').locator('p').dblclick();
        await expect(block.locator('textarea')).toBeVisible();
    });
    test('should edit HTML block text and image attributes in visual mode', async ({
        mount,
        page,
    }) => {
        await mount(
            <YFMStories.YfmHtmlBlock
                initial={
                    '::: html\n<h1>Hello</h1><img src="broken.png" alt="Before" width="80" height="40">\n:::'
                }
            />,
        );

        const block = page.locator('.g-md-yfm-html-block');
        const modes = block.getByRole('group', {name: 'View mode'});
        const editor = modes.getByRole('button', {name: 'Editor'});
        const code = modes.getByRole('button', {name: 'Code'});
        await block.hover();
        await expect(editor).toHaveAttribute('aria-pressed', 'true');

        const heading = block.frameLocator('iframe').locator('h1');
        await heading.hover();
        await block.getByRole('button', {name: 'Edit element'}).click();
        const dialog = page.getByRole('dialog', {name: 'Edit element'});
        await dialog.getByRole('textbox', {name: 'Text'}).fill('Updated heading');
        await dialog.getByRole('button', {name: 'Save'}).click();
        await expect(heading).toHaveText('Updated heading');

        const image = block.frameLocator('iframe').locator('img');
        await image.hover();
        await block.getByRole('button', {name: 'Edit element'}).click();
        await dialog.getByRole('textbox', {name: 'Value: alt'}).fill('After');
        await dialog.getByRole('button', {name: 'Save'}).click();
        await expect(image).toHaveAttribute('alt', 'After');

        await block.hover();
        await code.click();
        await expect(block.locator('textarea')).toContainText('Updated heading');
        await expect(block.locator('textarea')).toContainText('alt="After"');

        await block.locator('textarea').fill('<p>Edited in code</p>');
        await block.getByRole('button', {name: 'Save'}).click();
        await expect(block.frameLocator('iframe').locator('p')).toHaveText('Edited in code');
        await expect(editor).toHaveAttribute('aria-pressed', 'true');
    });
    test('should offer inline editing in the HTML block story', async ({mount, page}) => {
        await mount(<YFMStories.YfmHtmlBlock />);

        const block = page.locator('.g-md-yfm-html-block').first();
        await block.hover();
        await expect(block.getByRole('button', {name: 'Editor'})).toHaveAttribute(
            'aria-pressed',
            'true',
        );
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
        const heading = block.frameLocator('iframe').locator('h1');
        await heading.hover();
        await expect(block.getByRole('button', {name: 'Edit element'})).toBeVisible();
        await expect(block.getByRole('button', {name: 'Edit element'})).toHaveScreenshot(
            'html-block-edit-button.png',
        );
        const scrollBefore = await page.evaluate(() => window.scrollY);
        await block.getByRole('button', {name: 'Edit element'}).click();
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollBefore);
        const dialog = page.getByRole('dialog', {name: 'Edit element'});
        await block
            .frameLocator('iframe')
            .locator('body')
            .click({position: {x: 1, y: 1}});
        await expect(dialog).toHaveCount(0);

        await heading.hover();
        await block.getByRole('button', {name: 'Edit element'}).click();
        await dialog.getByRole('textbox', {name: 'Text'}).fill('Updated heading');
        await dialog.getByRole('button', {name: 'Save'}).click();
        await expect(heading).toHaveText('Updated heading');
        const frameSize = await block
            .frameLocator('iframe')
            .locator('body')
            .evaluate((body) => ({
                height: body.scrollHeight,
                visibleHeight: body.ownerDocument.documentElement.clientHeight,
            }));
        expect(frameSize.height).toBeLessThanOrEqual(frameSize.visibleHeight);
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
