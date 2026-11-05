import {expect, test} from 'playwright/core';

import {YFMStories} from './YfmExtensions.helpers';

const content = (title: string) => `blocks:
  - type: header-block
    title: ${title}
    description: '**Page content**'
    buttons:
      - text: Continue
        url: '#next'
        theme: normal-contrast`;

for (const colorScheme of ['light', 'dark'] as const) {
    test(`should preserve Page Constructor editing and preview in the ${colorScheme} theme`, async ({
        mount,
        page,
        editor,
    }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.emulateMedia({colorScheme});
        await mount(
            <YFMStories.YfmPageConstructor
                initial={`::: page-constructor\n${content('Original page')}\n:::`}
            />,
        );

        const nodeView = page.locator('.g-md-yfm-page-constructor').first();
        const preview = page.getByTestId('demo-md-preview');
        await expect(nodeView.getByRole('heading', {name: 'Original page'})).toBeVisible();
        await expect(nodeView.getByRole('link', {name: 'Continue'})).toHaveClass(
            /g-button_view_contrast-light/,
        );

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
}
