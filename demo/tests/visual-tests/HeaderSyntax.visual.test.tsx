import {headerTitleSizes} from '@gravity-ui/markdown-plugin-header';

import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/header-title';

import {HeaderSyntaxStories} from './HeaderSyntax.helpers';
import {compactHeaderStyles, markupSection} from './utils/markup-examples';

// title-001 … title-063: no size, then every size, each without a color and with every color.
const TITLE_GROUPS = ['no size', ...headerTitleSizes.map((size) => `size ${size}`)];
const TITLE_GROUP_SIZE = 9;
/** The section of the titles split into a section per group, in the order of the examples. */
const titleSections = markupSection('Title size and color').flatMap(
    ({title, description, examples}) =>
        TITLE_GROUPS.map((group, index) => ({
            title: `${title}: ${group}`,
            description,
            examples: examples.slice(index * TITLE_GROUP_SIZE, (index + 1) * TITLE_GROUP_SIZE),
        })),
);

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

    test('should show the titles of a section in every size and color', async ({
        mount,
        page,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        await mount(<HeaderSyntaxStories.AllCases sections={titleSections} />, {
            width: 1100,
            styles: compactHeaderStyles,
        });
        const story = page.getByTestId('header-syntax');
        const sections = story.getByTestId('header-syntax-section');
        const examples = story.getByTestId('header-syntax-example');
        await expect(sections).toHaveCount(TITLE_GROUPS.length);
        await expect(examples).toHaveCount(63);
        await expect(examples.last()).toContainText('title-063 — Size: 6 · Color: violet');
        await expect(examples.last().locator('pre')).toHaveText(
            ':::header\n\n::header-title[Team portal]{size="6" color="violet"}\n:::',
        );
        await expect(header.previews).toHaveCount(63);
        await expect(headerTitle.previews).toHaveCount(63);
        await expect(headerTitle.previews.last()).toHaveAttribute('aria-level', '6');
        await expect(headerTitle.previews.last()).toHaveAttribute('data-color', 'violet');
        // A screenshot of all 63 examples is too tall for an image: one per group of 9.
        for (const [index, group] of TITLE_GROUPS.entries()) {
            const section = sections.nth(index);
            const id = `title-${String(index * TITLE_GROUP_SIZE + 1).padStart(3, '0')}`;
            await expect(section.getByTestId('header-syntax-example')).toHaveCount(
                TITLE_GROUP_SIZE,
            );
            await expect(section.getByTestId('header-syntax-example').first()).toContainText(id);
            await expectScreenshot({component: section, nameSuffix: group});
        }
    });

    test('should show the headers of a section in their own sizes', async ({
        mount,
        page,
        header,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderSyntaxStories.AllCases sections={markupSection('Combined examples')} />,
            {width: 1100},
        );
        const story = page.getByTestId('header-syntax');
        await expect(story.getByTestId('header-syntax-example')).toHaveCount(16);
        await expect(header.previews).toHaveCount(16);
        await expect(header.previewsWith('data-height', 'l')).toHaveCount(16);
        await expect(header.previewsWith('data-width', 'full')).toHaveCount(16);
        await expect(header.previewsWith('data-align', 'center')).toHaveCount(8);
        await expect(header.previewsWith('data-align', 'right')).toHaveCount(8);
        await expect(header.previewsWith('data-bg-image-blur')).toHaveCount(16);
        expect((await header.getPreviewSizes()).map(([, height]) => height)).toEqual(
            Array(16).fill(360),
        );
        await header.waitForImage('/assets/test-image.jpg');
        await expectScreenshot({component: story});
    });
});
