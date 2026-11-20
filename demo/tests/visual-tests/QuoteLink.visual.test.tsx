import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/quote-link';

import {QuoteLinkStories} from './QuoteLink.helpers';

const quoteLinkMarkup = '> [Source](https://example.com){data-quotelink=true}\n>\n> Quote text';

test.describe('QuoteLink', () => {
    test('should render a quote link @wysiwyg', async ({
        mount,
        editor,
        quoteLink,
        expectScreenshot,
    }) => {
        await mount(<QuoteLinkStories.Story width={660} initial={quoteLinkMarkup} />);
        await expect(quoteLink.blocks).toHaveCount(1);
        await expect(quoteLink.blocks).toHaveAttribute('cite', 'https://example.com');
        await expect(quoteLink.blocks).toContainText('Quote text');
        await expectScreenshot({component: editor.locators.component});
    });

    test('should open the link form from the toolbar @wysiwyg', async ({
        mount,
        page,
        editor,
        quoteLink,
        wait,
        expectScreenshot,
    }) => {
        await mount(<QuoteLinkStories.Story width={660} height={250} />);
        await editor.focus();
        await editor.clickMainToolbarButton('Quote link');
        await expect(quoteLink.blocks).toHaveCount(1);
        await expect(quoteLink.form).toBeVisible();
        await page.mouse.move(-1, -1);
        await wait.tooltipsHidden();
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render a quote link in the preview @markup', async ({
        mount,
        page,
        editor,
        quoteLink,
        wait,
        expectScreenshot,
    }) => {
        await mount(<QuoteLinkStories.Story mode="markup" width={660} initial={quoteLinkMarkup} />);
        await editor.switchPreview('visible');
        await expect(quoteLink.previewBlocks).toHaveCount(1);
        await expect(quoteLink.previewBlocks).toContainText('Quote text');
        await page.mouse.move(-1, -1);
        await wait.tooltipsHidden();
        await expectScreenshot({component: editor.locators.component});
    });
});
