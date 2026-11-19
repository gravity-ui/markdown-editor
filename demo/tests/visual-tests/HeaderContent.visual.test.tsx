import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/header-content';

import {HeaderStories} from './Header.helpers';

const PARAGRAPH_GAP = 8;
const REGULAR_TYPOGRAPHY = ['15px', '20px', '400'];

const values = [
    {
        paragraphs: [
            'Portal description.',
            'Text with bold, italic, underlined, strikethrough and monospace text and a link.',
        ],
    },
];

test.describe('Header content', () => {
    test('should render the description in the preview @markup', async ({
        mount,
        page,
        editor,
        headerContent,
        wait,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 1060, height: 700});
        await mount(<HeaderStories.Description mode="markup" width={1000} />);
        await editor.switchPreview('visible');
        // The empty description of the second banner renders nothing.
        await expect(headerContent.previews).toHaveCount(1);
        expect(await headerContent.getValues()).toEqual(values);
        expect(
            await headerContent.getTypography(headerContent.previews.locator(':scope > p')),
        ).toEqual([REGULAR_TYPOGRAPHY, REGULAR_TYPOGRAPHY]);
        expect(await headerContent.getParagraphGaps()).toEqual([PARAGRAPH_GAP]);
        for (const tag of ['strong', 'em', 'ins', 's', 'code', 'a']) {
            await expect(headerContent.previews.locator(tag)).toHaveCount(1);
        }
        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        await expectScreenshot({component: editor.locators.component});
    });

    test('should keep the blocks of a second description in the preview @markup', async ({
        mount,
        editor,
        headerContent,
    }) => {
        await mount(
            <HeaderStories.Description
                mode="markup"
                initial={
                    ':::header\n\n:::header-content\nFirst.\n:::\n\n:::header-content\nSecond.\n:::\n\n:::'
                }
            />,
        );
        await editor.switchPreview('visible');
        await expect(headerContent.previews).toHaveCount(1);
        expect(await headerContent.getValues()).toEqual([{paragraphs: ['First.']}]);
        await expect(editor.locators.previewContent.getByText('Second.')).toBeVisible();
    });
});
