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

    test('should insert via toolbar @wysiwyg', async ({
        mount,
        page,
        editor,
        quoteLink,
        expectScreenshot,
    }) => {
        await mount(<QuoteLinkStories.Story width={660} />);
        await editor.focus();
        await editor.clickMainToolbarButton('Quote link');
        await expect(quoteLink.blocks).toHaveCount(1);
        await expect(quoteLink.form).toBeVisible();
        await expectScreenshot({component: quoteLink.form, nameSuffix: 'form'});

        await quoteLink.addLink('https://example.com', 'Source');
        await expect(quoteLink.blocks).toHaveAttribute('cite', 'https://example.com');
        await expectScreenshot({component: editor.locators.component});
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toContain('> [Source](https://example.com){data-quotelink=true}');
    });

    test('should insert via toolbar @markup', async ({mount, page, editor}) => {
        await mount(<QuoteLinkStories.Story mode="markup" width={660} />);
        await editor.focus();
        await editor.clickMainToolbarButton('Quote link');
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toBe('> [link](url "title"){data-quotelink=true}\n> \n> ');
    });
});
