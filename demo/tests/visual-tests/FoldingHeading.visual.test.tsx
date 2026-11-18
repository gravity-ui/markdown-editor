import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/folding-heading';

import {FoldingHeadingStories} from './FoldingHeading.helpers';

const sectionsMarkup = '#+ Outer\n\nOuter text\n\n##+ Inner\n\nInner text\n\n# Next';

test.describe('FoldingHeading', () => {
    test('should render nested folded sections @wysiwyg', async ({
        mount,
        editor,
        foldingHeading,
        expectScreenshot,
    }) => {
        await mount(<FoldingHeadingStories.FoldingHeading width={660} initial={sectionsMarkup} />);
        await expect(foldingHeading.headings).toHaveCount(2);
        await expect(foldingHeading.heading('Outer')).toHaveAttribute('data-folded', 'true');
        await expect(foldingHeading.hiddenContent).toHaveCount(3);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should expand and collapse a section by the chevron @wysiwyg', async ({
        mount,
        page,
        editor,
        foldingHeading,
        expectScreenshot,
    }) => {
        await mount(<FoldingHeadingStories.FoldingHeading width={660} initial={sectionsMarkup} />);

        await foldingHeading.clickChevron('Outer');
        await expect(foldingHeading.heading('Outer')).toHaveAttribute('data-folded', 'false');
        await expect(foldingHeading.heading('Inner')).toBeVisible();
        await expect(foldingHeading.hiddenContent).toHaveCount(1);
        await expectScreenshot({component: editor.locators.component});
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toBe(sectionsMarkup);

        await foldingHeading.clickChevron('Outer');
        await expect(foldingHeading.heading('Outer')).toHaveAttribute('data-folded', 'true');
        await expect(foldingHeading.hiddenContent).toHaveCount(3);
    });

    test('should toggle folding via the selection toolbar @wysiwyg', async ({
        mount,
        page,
        editor,
        foldingHeading,
        expectScreenshot,
    }) => {
        await mount(
            <FoldingHeadingStories.FoldingHeading width={660} initial={'## Heading\n\nText'} />,
        );
        await editor.selectTextIn('h2');
        await editor.clickSelectionToolbarButton('Collapsed section');
        await expect(foldingHeading.heading('Heading')).toHaveAttribute('data-folded', 'false');
        await editor.assertSelectionToolbarButtonSelected('Collapsed section');
        await foldingHeading.hideTooltip();
        await expectScreenshot({component: editor.locators.component});
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toBe('##+ Heading\n\nText');

        await editor.clickSelectionToolbarButton('Collapsed section');
        await expect(foldingHeading.headings).toHaveCount(0);
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toBe('## Heading\n\nText');
    });

    test('should create a folding heading by the input rule @wysiwyg', async ({
        mount,
        page,
        editor,
        foldingHeading,
    }) => {
        await mount(<FoldingHeadingStories.FoldingHeading width={660} initial="" />);
        await editor.focus();
        await editor.inputRule('##+');
        await editor.pressSequentially('Section');
        await expect(foldingHeading.heading('Section')).toHaveAttribute('data-folded', 'false');
        await expect(foldingHeading.visibleContent).toHaveCount(1);
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toBe('##+ Section');
    });
});
