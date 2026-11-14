import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/button';

import {HeaderSyntaxStories} from './HeaderSyntax.helpers';
import {compactHeaderStyles, markupSection} from './utils/markup-examples';

test.describe('Header syntax', () => {
    test('should show the source and the preview of every example of a section', async ({
        mount,
        page,
        button,
        header,
        expectScreenshot,
    }) => {
        await mount(<HeaderSyntaxStories.AllCases sections={markupSection('Button URLs')} />, {
            width: 1100,
            styles: compactHeaderStyles,
        });
        const story = page.getByTestId('header-syntax');
        const examples = story.getByTestId('header-syntax-example');
        await expect(story.getByRole('heading', {name: 'Button URLs', exact: true})).toBeVisible();
        await expect(examples).toHaveCount(25);
        await expect(examples.first()).toContainText('link-001 — URL type: omitted');
        await expect(examples.first().locator('pre')).toHaveText(
            ':::header\n\n:button[Learn more]{view="action" color="blue"}\n:::',
        );
        await expect(header.previews).toHaveCount(25);
        await expect(button.variants).toHaveCount(25);
        await expectScreenshot({component: story});
    });
});
