import {headerTitleSizes} from '@gravity-ui/markdown-plugin-header';

import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/header-content';

import {HeaderSyntaxStories} from './HeaderSyntax.helpers';
import {compactHeaderStyles, markupSection} from './utils/markup-examples';

/**
 * A section split into a section per group of its examples, in their order:
 * a screenshot of a whole section may be too tall for an image.
 */
const sectionGroups = (sectionTitle: string, groups: readonly string[], size: number) =>
    markupSection(sectionTitle).flatMap(({title, description, examples}) =>
        groups.map((group, index) => ({
            title: `${title}: ${group}`,
            description,
            examples: examples.slice(index * size, (index + 1) * size),
        })),
    );

// title-001 … title-063: no size, then every size, each without a color and with every color.
const TITLE_GROUPS = ['no size', ...headerTitleSizes.map((size) => `size ${size}`)];
const TITLE_GROUP_SIZE = 9;
const titleSections = sectionGroups('Title size and color', TITLE_GROUPS, TITLE_GROUP_SIZE);

// nested-001 … nested-064: the combinations of the marks and a link, 16 for each pair
// of bold and italic text; nested-065 … nested-078: the links and the nested marks.
const NESTED_GROUPS = [
    'no bold, no italic',
    'italic',
    'bold',
    'bold and italic',
    'links and nesting',
];
const NESTED_GROUP_SIZE = 16;
const NESTED_COUNT = 78;
const nestedSections = sectionGroups(
    'Links and nested formatting in the description',
    NESTED_GROUPS,
    NESTED_GROUP_SIZE,
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

    test('should show the descriptions of a section in every size', async ({
        mount,
        page,
        header,
        headerContent,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderSyntaxStories.AllCases
                sections={markupSection('Description size and paragraphs')}
            />,
            {width: 1100, styles: compactHeaderStyles},
        );
        const story = page.getByTestId('header-syntax');
        const examples = story.getByTestId('header-syntax-example');
        await expect(examples).toHaveCount(14);
        await expect(examples.last()).toContainText('description-014 — Size: 6 · Paragraphs: 2');
        await expect(examples.first().locator('pre')).toHaveText(
            ':::header\n\n:::header-content\nPortal description.\n:::\n:::',
        );
        await expect(header.previews).toHaveCount(14);
        await expect(headerContent.previews).toHaveCount(14);
        await expect(headerContent.previewsWith('data-size')).toHaveCount(12);
        await expect(headerContent.previews.last()).toHaveAttribute('data-size', '6');
        await expect(headerContent.previews.last().locator('p')).toHaveCount(2);
        await expectScreenshot({component: story});
    });

    test('should show the marks and the links of the descriptions of a section', async ({
        mount,
        page,
        header,
        headerContent,
        expectScreenshot,
    }) => {
        await mount(<HeaderSyntaxStories.AllCases sections={nestedSections} />, {
            width: 1100,
            styles: compactHeaderStyles,
        });
        const story = page.getByTestId('header-syntax');
        const sections = story.getByTestId('header-syntax-section');
        const examples = story.getByTestId('header-syntax-example');
        await expect(sections).toHaveCount(NESTED_GROUPS.length);
        await expect(examples).toHaveCount(NESTED_COUNT);
        await expect(examples.nth(63)).toContainText(
            'nested-064 — Bold: on · Italic: on · Underline: on · Strikethrough: on · Inline code: on · Link: on',
        );
        await expect(examples.nth(63).locator('pre')).toHaveText(
            ':::header\n\n::header-title[Team portal]\n\n:::header-content\nPlain text. **Bold text.** *Italic text.* ++Underlined text.++ ~~Strikethrough text.~~ `inline code` [Team page](/page)\n:::\n:::',
        );
        await expect(header.previews).toHaveCount(NESTED_COUNT);
        await expect(headerContent.previews).toHaveCount(NESTED_COUNT);
        await expect(headerContent.previews.nth(63)).toHaveText(
            'Plain text. Bold text. Italic text. Underlined text. Strikethrough text. inline code Team page',
        );
        // A screenshot of all 78 examples is too tall for an image: one per group.
        for (const [index, group] of NESTED_GROUPS.entries()) {
            const section = sections.nth(index);
            const first = index * NESTED_GROUP_SIZE;
            const id = `nested-${String(first + 1).padStart(3, '0')}`;
            await expect(section.getByTestId('header-syntax-example')).toHaveCount(
                Math.min(NESTED_GROUP_SIZE, NESTED_COUNT - first),
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
