import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/header-content';

import {headerDescriptionMarkup} from '../../src/stories/header/markup';

import {HeaderStories} from './Header.helpers';

const PARAGRAPH_GAP = 8;
const REGULAR_TYPOGRAPHY = ['15px', '20px', '400'];
const PLACEHOLDER = 'Short text: for example, what this page is about and who it is for';
const SAMPLE_DESCRIPTION =
    'Here you will find the main rules and recommendations for working in our services';

const values = [
    {
        paragraphs: [
            'Portal description.',
            'Text with bold, italic, underlined, strikethrough and monospace text and a link.',
        ],
    },
];

test.describe('Header content', () => {
    test('should render formatted text and the placeholder of an empty description @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
        headerContent,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 760, height: 620});
        await mount(<HeaderStories.Description width={700} />);
        const contents = headerContent.inHeaders(header.blocks);
        await expect(contents).toHaveCount(2);
        expect((await headerContent.getValues(contents))[0]).toEqual(values[0]);
        expect(await headerContent.getTypography(headerContent.paragraphs)).toEqual([
            REGULAR_TYPOGRAPHY,
            REGULAR_TYPOGRAPHY,
        ]);
        expect(await headerContent.getParagraphGaps(contents.first())).toEqual([PARAGRAPH_GAP]);
        for (const tag of ['strong', 'em', 'ins', 'strike', 'code', 'a']) {
            await expect(contents.first().locator(tag)).toHaveCount(1);
        }
        await expect(headerContent.placeholders).toHaveText([PLACEHOLDER]);
        await editor.focus();
        await header.hideToolbar();
        await page.mouse.move(0, 0);
        await expectScreenshot();
    });

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

    test('should keep the description when switching modes @wysiwyg @markup', async ({
        mount,
        page,
        editor,
        headerContent,
    }) => {
        await mount(<HeaderStories.Description mode="markup" />);
        await editor.switchMode('wysiwyg');
        await expect(headerContent.blocks).toHaveCount(2);
        expect((await headerContent.getValues(headerContent.blocks))[0]).toEqual(values[0]);
        await editor.switchMode('markup');
        expect(await page.evaluate(() => window.mdEditor?.getValue())).toBe(
            headerDescriptionMarkup,
        );
    });

    test('should keep the text in the description on Enter and Backspace @wysiwyg', async ({
        mount,
        editor,
        headerContent,
    }) => {
        await mount(<HeaderStories.Description />);
        await headerContent.paragraphs.first().click();
        await editor.press('End');
        await editor.pressSequentially(' More text.');
        await editor.press('Enter');
        await expect(headerContent.paragraphs).toHaveCount(3);
        await editor.press('Enter');
        await expect(headerContent.paragraphs).toHaveCount(3);
        await editor.pressSequentially('New paragraph.');
        await editor.press('Home');
        await editor.press('Backspace');
        await expect(headerContent.paragraphs).toHaveCount(2);
        await expect(headerContent.paragraphs.first()).toHaveText(
            'Portal description. More text.New paragraph.',
        );
        await editor.press('Home');
        await editor.press('Backspace');
        await expect(headerContent.blocks).toHaveCount(2);
        await expect(headerContent.paragraphs).toHaveCount(2);
    });

    test('should remove the description and restore its text with the settings switch @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
        headerContent,
        wait,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 740, height: 980});
        await mount(<HeaderStories.Description width={660} />);
        await headerContent.paragraphs.first().click();
        await editor.press('End');
        await editor.pressSequentially(' Edited.');
        const edited = await page.evaluate(() => window.mdEditor?.getValue());
        await header.openSettings();
        await expect(header.toggle('Description')).toBeChecked();
        await header.clickToggle('Description');
        await expect(header.toggle('Description')).not.toBeChecked();
        await expect(headerContent.blocks).toHaveCount(1);
        await header.setExpandedSections('Text');
        const removed = await page.evaluate(() => window.mdEditor?.getValue());
        await wait.markupPreview(removed ?? '');
        await expectScreenshot();
        await header.clickToggle('Description');
        await expect(header.toggle('Description')).toBeChecked();
        await expect(headerContent.paragraphs.first()).toHaveText('Portal description. Edited.');
        expect(await page.evaluate(() => window.mdEditor?.getValue())).toBe(edited);
    });

    test('should add a description with a sample text to an empty banner @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
        headerContent,
    }) => {
        await mount(<HeaderStories.Header />);
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await header.openSettings();
        await expect(header.toggle('Description')).not.toBeChecked();
        await header.clickToggle('Description');
        await expect(header.toggle('Description')).toBeChecked();
        await expect(headerContent.paragraphs).toHaveText([SAMPLE_DESCRIPTION]);
        await header.clickToggle('Description');
        await expect(headerContent.blocks).toHaveCount(0);
        expect(await page.evaluate(() => window.mdEditor?.getValue())).toBe(
            ':::header{height="s" width="m"}\n\n:::\n\nAfter',
        );
    });
});
