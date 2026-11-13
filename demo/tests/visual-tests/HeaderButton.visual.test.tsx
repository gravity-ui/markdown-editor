import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/button';

import {buttonMarkup, buttonRowsMarkup, inHeader} from '../../src/stories/header/markup';

import {HeaderButtonStories} from './HeaderButton.helpers';

// One button of every view in its default color and in a color of a family.
const stateStyles = [
    ['action', 'standard'],
    ['action', 'blue'],
    ['normal', 'gray'],
    ['normal', 'blue'],
    ['outline', 'gray'],
    ['outline', 'blue'],
    ['flat', 'standard'],
    ['flat', 'gray'],
    ['flat', 'blue'],
] as const;
const statesMarkup = stateStyles.map((style) => buttonMarkup(style)).join(' ');

const longLabel =
    'A long label that does not fit into one line of the column and wraps onto the next lines of the button';
const stressMarkup = [
    `:button[${longLabel}]{href="https://example.com" view="action" color="blue"}`,
    `:button[${'Unbreakable'.repeat(12)}]{href="https://example.com" view="normal" color="gray"}`,
    ':button[**Bold** _italic_ ~~strike~~ `code` <b>tag</b> &copy; &amp; \\[brackets\\] "quotes"]{href="https://example.com" view="outline" color="green"}',
    'Text before :button[One]{href="https://example.com" view="action" color="standard"} text between :button[Two]{href="https://example.com" view="outline" color="red"} and text after the buttons that goes on to the next line of the paragraph.',
    ':button[No address]{view="action" color="violet"} :button[No address]{view="normal" color="yellow"} :button[No address]{view="outline" color="gray"} :button[No address]{view="flat" color="standard"}',
    Array.from({length: 12}, (_, index) =>
        buttonMarkup(stateStyles[index % stateStyles.length], `Button ${index + 1}`),
    ).join(' '),
    ':button[A]{href="https://example.com" view="action" color="green"} :button[Кнопка]{href="https://example.com" view="normal" color="violet"} :button[Unknown values]{href="https://example.com" view="unknown" color="orange"}',
].join('\n\n');

test.describe('Header button', () => {
    test('should render every view and color in the text and in a header @markup', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<HeaderButtonStories.Button />);
        await expect(button.variants).toHaveCount(50);
        expect(await button.getFilledBackgrounds(button.variants)).not.toContain(
            'rgba(0, 0, 0, 0)',
        );
        await expectScreenshot({component: editor.locators.component});
    });

    test('should show the hover state of every view @markup', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<HeaderButtonStories.Button initial={statesMarkup} />);
        await expect(button.variants).toHaveCount(stateStyles.length);

        const action = button.variant('action', 'blue');
        const idle = await button.getBackground(action);
        await action.hover();
        await expect(action).not.toHaveCSS('background-color', idle);
        await expectScreenshot({component: editor.locators.component, nameSuffix: 'action'});

        const normal = button.variant('normal', 'gray');
        const normalIdle = await button.getBackground(normal);
        await normal.hover();
        await expect(normal).not.toHaveCSS('background-color', normalIdle);
        await expectScreenshot({component: editor.locators.component, nameSuffix: 'normal'});

        const outline = button.variant('outline', 'blue');
        await outline.hover();
        await expect(outline).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        await expectScreenshot({component: editor.locators.component, nameSuffix: 'outline'});

        const flat = button.variant('flat', 'gray');
        await flat.hover();
        await expect(flat).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        await expectScreenshot({component: editor.locators.component, nameSuffix: 'flat'});
    });

    test('should show the keyboard focus @markup', async ({
        mount,
        editor,
        button,
        wait,
        expectScreenshot,
    }) => {
        await mount(<HeaderButtonStories.Button initial={statesMarkup} />);
        await expect(button.variants).toHaveCount(stateStyles.length);

        const action = button.variant('action', 'blue');
        await button.focusWithKeyboard(action);
        await expect(action).toBeFocused();
        await expect(action).toHaveCSS('outline-style', 'solid');
        await wait.tooltipsHidden();
        await expectScreenshot({component: editor.locators.component, nameSuffix: 'action'});

        const outline = button.variant('outline', 'blue');
        await button.focusWithKeyboard(outline);
        await expect(outline).toBeFocused();
        await expect(outline).toHaveCSS('outline-style', 'solid');
        await expectScreenshot({component: editor.locators.component, nameSuffix: 'outline'});
    });

    test('should wrap long labels and show labels as written @markup', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderButtonStories.Button
                width={600}
                initial={`${stressMarkup}\n\n${inHeader(stressMarkup)}`}
            />,
        );
        await expect(button.variants).toHaveCount(48);
        await expect(button.variants.nth(2)).toHaveText(
            '**Bold** _italic_ ~~strike~~ `code` <b>tag</b> &copy; &amp; [brackets] "quotes"',
        );
        await expect(button.variants.filter({hasText: 'No address'}).first()).not.toHaveAttribute(
            'href',
        );
        await expectScreenshot({component: editor.locators.component});
    });
});

test.describe('Header button on mobile', () => {
    test.use({viewport: {width: 343, height: 812}});

    test('should fit a narrow viewport @markup', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        const markup = [
            buttonRowsMarkup(),
            `:button[${longLabel}]{href="https://example.com" view="action" color="blue"}`,
            inHeader(
                [
                    buttonMarkup(['action', 'blue']),
                    buttonMarkup(['normal', 'gray']),
                    buttonMarkup(['flat', 'standard']),
                ].join(' '),
            ),
        ].join('\n\n');
        await mount(<HeaderButtonStories.Button width={343} initial={markup} />, {
            rootStyle: {padding: 0},
        });
        await expect(button.variants).toHaveCount(29);
        expect(
            await editor.locators.previewContent.evaluate(
                (element) => element.scrollWidth <= element.clientWidth,
            ),
        ).toBe(true);
        await expectScreenshot({component: editor.locators.component});
    });
});
