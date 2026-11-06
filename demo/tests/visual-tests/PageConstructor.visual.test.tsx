import {expect, test} from 'playwright/core';

import {Playground} from './playground/Playground.helpers';

const content = (title: string) => `blocks:
  - type: header-block
    title: ${title}
    description: Page content
    buttons:
      - text: Continue
        url: '#next'
        theme: normal-contrast`;

const initial = `::: page-constructor\n${content('Original page')}\n:::`;

test.describe('Page Constructor', () => {
    test('should show a contrast button @wysiwyg', async ({
        mount,
        page,
        wait,
        expectScreenshot,
    }) => {
        await mount(<Playground initial={initial} width="100%" style={{width: 812}} />);
        await page.setViewportSize({height: 500, width: 812});
        await wait.loadersHidden();

        const nodeView = page.locator('.g-md-yfm-page-constructor').first();
        await expect(nodeView.getByRole('link', {name: 'Continue'})).toBeVisible();

        await expectScreenshot();
    });

    test('should keep edits in markup and preview', async ({mount, page, editor}) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await mount(<Playground initial={initial} />);

        const nodeView = page.locator('.g-md-yfm-page-constructor').first();
        const preview = page.getByTestId('demo-md-preview');

        await nodeView.getByRole('heading', {name: 'Original page'}).dblclick();
        const editing = page.locator('.g-md-yfm-page-constructor_edit');
        await editing.getByRole('textbox').fill(content('Updated page'));
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toContain('Updated page');
        await editing.getByRole('button', {name: 'Close', exact: true}).click();

        await editor.switchMode('markup');
        await expect(page.locator('.cm-content')).toContainText('::: page-constructor');
        await expect(page.locator('.cm-content')).toContainText('Updated page');
        await editor.switchPreview('visible');
        await expect(preview.getByRole('heading', {name: 'Updated page'})).toBeVisible();

        await editor.switchMode('wysiwyg');
        await expect(nodeView.getByRole('heading', {name: 'Updated page'})).toBeVisible();
        expect(errors).toEqual([]);
    });
});
