import {expect, test} from 'playwright/core';

import {HeaderSyntaxStories} from './HeaderSyntax.helpers';
import {markupSection} from './utils/markup-examples';

// The height of a header belongs to the header tests; a lower one keeps the screenshot short.
const compactHeaders = ':root {--g-md-header-plugin-height-s: 72px;}';

test.describe('Header syntax', () => {
    test('should show the source and the preview of every example of a section', async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await mount(<HeaderSyntaxStories.AllCases sections={markupSection('Button URLs')} />, {
            width: 1100,
            styles: compactHeaders,
        });
        const story = page.getByTestId('header-syntax');
        const examples = story.getByTestId('header-syntax-example');
        await expect(story.getByRole('heading', {name: 'Button URLs', exact: true})).toBeVisible();
        await expect(examples).toHaveCount(25);
        await expect(examples.first()).toContainText('link-001 — URL type: omitted');
        await expect(examples.first().locator('pre')).toHaveText(
            ':::header\n\n:button[Learn more]{view="action" color="blue"}\n:::',
        );
        await expect(story.locator('.g-md-header-plugin .g-md-button-plugin')).toHaveCount(25);
        await expectScreenshot({component: story});
    });
});
