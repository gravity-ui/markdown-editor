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

    test('should toggle folding via the selection toolbar @wysiwyg', async ({
        mount,
        page,
        editor,
        foldingHeading,
        wait,
        expectScreenshot,
    }) => {
        const title = 'Section with a long heading';
        await mount(
            <FoldingHeadingStories.FoldingHeading width={660} initial={`## ${title}\n\nText`} />,
        );
        await editor.selectTextIn('h2');
        await editor.clickSelectionToolbarButton('Collapsed section');
        await expect(foldingHeading.heading(title)).toHaveAttribute('data-folded', 'false');
        await editor.assertSelectionToolbarButtonSelected('Collapsed section');
        await page.mouse.move(-1, -1);
        await wait.tooltipsHidden();
        await expectScreenshot({component: editor.locators.component});
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toBe(`##+ ${title}\n\nText`);

        await editor.clickSelectionToolbarButton('Collapsed section');
        await expect(foldingHeading.headings).toHaveCount(0);
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toBe(`## ${title}\n\nText`);
    });

    test('should render folded sections in the preview @markup', async ({
        mount,
        page,
        editor,
        foldingHeading,
        wait,
        expectScreenshot,
    }) => {
        await mount(
            <FoldingHeadingStories.FoldingHeading
                mode="markup"
                width={660}
                initial={sectionsMarkup}
            />,
        );
        await editor.switchPreview('visible');
        await expect(foldingHeading.previewSections).toHaveCount(2);
        await page.mouse.move(-1, -1);
        await wait.tooltipsHidden();
        await expectScreenshot({component: editor.locators.component});
    });
});
