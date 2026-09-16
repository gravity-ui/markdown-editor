import {Buffer} from 'node:buffer';

import {expect, test} from 'playwright/core';

import {HeaderStories} from './Header.helpers';

test.describe('Extensions, Header', () => {
    test('Empty', async ({mount, expectScreenshot}) => {
        await mount(<HeaderStories.Empty />);
        await expectScreenshot();
    });

    test('Title, description and actions', async ({mount, expectScreenshot}) => {
        await mount(<HeaderStories.Filled />);
        await expectScreenshot();
    });

    test('Compact format', async ({mount, expectScreenshot}) => {
        await mount(<HeaderStories.Compact />);
        await expectScreenshot();
    });

    test('Bleed edges', async ({mount, expectScreenshot}) => {
        await mount(<HeaderStories.Bleed />);
        await expectScreenshot();
    });

    test('Fill palette', async ({mount, expectScreenshot}) => {
        await mount(<HeaderStories.Fills />);
        await expectScreenshot();
    });

    test('Border styles', async ({mount, expectScreenshot}) => {
        await mount(<HeaderStories.Borders />);
        await expectScreenshot();
    });

    test('Empty image slot', async ({mount, expectScreenshot}) => {
        await mount(<HeaderStories.EmptyImageSlot />);
        await expectScreenshot();
    });

    test('Background image', async ({mount, expectScreenshot}) => {
        await mount(<HeaderStories.BackgroundImage />);
        await expectScreenshot();
    });

    test('Background image, light text', async ({mount, expectScreenshot}) => {
        await mount(<HeaderStories.BackgroundImageLightText />);
        await expectScreenshot();
    });

    test('Image beside the text', async ({mount, expectScreenshot}) => {
        await mount(<HeaderStories.ImageBesideText />);
        await expectScreenshot();
    });

    test('Every attribute at once', async ({mount, expectScreenshot}) => {
        await mount(<HeaderStories.EveryAttribute />);
        await expectScreenshot();
    });

    test('Inside a cut', async ({mount, expectScreenshot}) => {
        await mount(<HeaderStories.InsideCut />);
        await expectScreenshot();
    });
    test('Broken yaml in the body', async ({mount, expectScreenshot}) => {
        await mount(<HeaderStories.BrokenYaml />);
        await expectScreenshot();
    });

    test('Compact centered toolbar', async ({mount, page, expectScreenshot}) => {
        await mount(<HeaderStories.Filled />, {width: 800, hidePlaygroundBlocks: true});
        const header = page.getByTestId('g-md-header');
        const toolbar = page.getByTestId('g-md-toolbar-header');

        await header.locator('.g-md-header-title').click();
        await expect(toolbar).toBeVisible();
        await expect
            .poll(async () => {
                const block = await header.boundingBox();
                const panel = await toolbar.boundingBox();
                if (!block || !panel) return Infinity;
                return Math.abs(block.x + block.width / 2 - panel.x - panel.width / 2);
            })
            .toBeLessThan(1);
        expect((await toolbar.boundingBox())?.width).toBeLessThan(300);

        await page.mouse.move(0, 0);
        await expectScreenshot();
    });

    test('Appearance settings popup', async ({mount, page, expectScreenshot}) => {
        await mount(<HeaderStories.Filled />, {width: 800, hidePlaygroundBlocks: true});
        const header = page.getByTestId('g-md-header');
        await header.locator('.g-md-header-title').click();
        await page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Appearance', exact: true})
            .click();
        const size = page.getByRole('group', {name: 'Size', exact: true});
        await expect(size).toBeVisible();
        await expect(size.getByRole('button', {name: 'Large', exact: true})).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        for (const name of ['Edges', 'Border', 'Text colour']) {
            await expect(page.getByRole('group', {name, exact: true})).toBeVisible();
        }

        await page.mouse.move(0, 0);
        await expectScreenshot();

        const compact = size.getByRole('button', {name: 'Compact', exact: true});
        await compact.click();
        await expect(header).toHaveAttribute('data-format', 'small');
        await expect(size).toBeVisible();
        await expect(compact).toHaveAttribute('aria-pressed', 'true');
        await expect(compact).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(size).toBeHidden();
        await expect(header).toHaveAttribute('data-format', 'small');
    });

    test('Image settings popup', async ({mount, page, expectScreenshot}) => {
        await mount(<HeaderStories.BackgroundImage />, {width: 800, hidePlaygroundBlocks: true});
        await page.getByTestId('g-md-header').locator('.g-md-header-title').click();
        await page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Image', exact: true})
            .click();
        await expect(page.getByRole('textbox', {name: 'Image URL'})).toHaveValue(
            '/assets/header-cover.svg',
        );
        const layout = page.getByRole('group', {name: 'Image layout', exact: true});
        await expect(layout.getByRole('button', {name: 'Background', exact: true})).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        await expect(page.getByRole('button', {name: 'Apply', exact: true})).toHaveCount(0);
        await expect(page.getByLabel('Open image', {exact: true})).toHaveAttribute(
            'href',
            '/assets/header-cover.svg',
        );

        await page.mouse.move(0, 0);
        await expectScreenshot();

        await layout.getByRole('button', {name: 'Beside the text', exact: true}).click();
        await expect(page.getByTestId('g-md-header')).toHaveAttribute('data-layout', 'split');
        await expect(page.getByRole('textbox', {name: 'Image URL'})).toHaveValue(
            '/assets/header-cover.svg',
        );
    });

    test('Uploaded image renders after leaving the header', async ({mount, page, editor}) => {
        await mount(<HeaderStories.Filled />);
        const header = page.getByTestId('g-md-header');
        const toolbar = page.getByTestId('g-md-toolbar-header');
        await header.locator('.g-md-header-title').click();
        await toolbar.getByRole('button', {name: 'Image', exact: true}).click();

        const fileChooser = page.waitForEvent('filechooser');
        await page.getByRole('button', {name: 'Upload image', exact: true}).click();
        await (
            await fileChooser
        ).setFiles({
            name: 'cover.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
                'base64',
            ),
        });
        await editor.locators.contenteditable
            .getByText('Обычный абзац под обложкой.', {exact: true})
            .click({position: {x: 8, y: 8}});
        await expect(toolbar).toBeHidden();

        await expect(header).toHaveAttribute('data-bg', 'image');
        await expect(header).toHaveAttribute('data-image', /^blob:/);
        await expect(header).not.toHaveAttribute('data-image-empty', 'true');
        await expect
            .poll(() =>
                header.evaluate((element) => getComputedStyle(element, '::before').backgroundImage),
            )
            .toMatch(/^url\("blob:/);
        const size = await header.evaluate(async (element) => {
            const image = new Image();
            image.src = element.getAttribute('data-image')!;
            await image.decode();
            return [image.naturalWidth, image.naturalHeight];
        });
        expect(size).toEqual([1, 1]);
    });

    test('Image URL works without an upload handler', async ({mount, page, editor}) => {
        await mount(<HeaderStories.Empty uploadEnabled={false} />);
        const header = page.getByTestId('g-md-header');
        await header.locator('.g-md-header-title').click();
        await page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Image', exact: true})
            .click();

        const input = page.getByRole('textbox', {name: 'Image URL'});
        await expect(input).toBeFocused();
        await expect(page.getByRole('button', {name: 'Upload image', exact: true})).toHaveCount(0);
        await input.fill('/assets/header-cover.svg');
        await input.press('Enter');

        await expect(input).toBeHidden();
        await expect(editor.locators.contenteditable).toBeFocused();
        await expect(header).toHaveAttribute('data-bg', 'image');
        await expect(header).toHaveAttribute('data-image', '/assets/header-cover.svg');
        await expect
            .poll(() =>
                header.evaluate((element) => getComputedStyle(element, '::before').backgroundImage),
            )
            .toContain('/assets/header-cover.svg');
    });

    test('Fill remains editable with an image', async ({mount, page, editor}) => {
        await mount(<HeaderStories.ImageBesideText />);
        const header = page.getByTestId('g-md-header');
        const previousFill = await header.evaluate(
            (element) => getComputedStyle(element).backgroundColor,
        );
        await header.locator('.g-md-header-title').click();
        const fill = page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Fill colour', exact: true});
        await expect(fill).toBeEnabled();
        await fill.click();
        const green = page.getByRole('button', {name: 'Green', exact: true});
        await green.focus();
        await green.press('Enter');

        await expect(header).toHaveAttribute('data-fill', 'green');
        await expect(header).toHaveAttribute('data-bg', 'image');
        await expect(header).toHaveAttribute('data-image', '/assets/header-portrait.svg');
        await expect
            .poll(() => header.evaluate((element) => getComputedStyle(element).backgroundColor))
            .not.toBe(previousFill);
        await expect(editor.locators.contenteditable).toBeFocused();

        await fill.click();
        await expect(green).toBeVisible();
        await expect(page.getByRole('button', {name: 'Grey', exact: true})).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(green).toBeHidden();
        await expect(fill).toBeFocused();
    });

    test('Action text keeps the caret while typing', async ({mount, page, editor}) => {
        await mount(<HeaderStories.Filled />);
        const header = page.getByTestId('g-md-header');
        const actions = header.locator('.g-md-header-action');

        await actions.first().click();
        await editor.press('End');
        await page.keyboard.type(' new label', {delay: 80});

        await expect(actions.first()).toHaveText('Начать работу new label');
        await expect
            .poll(() =>
                actions.first().evaluate((element) => {
                    const selection = window.getSelection();
                    return Boolean(
                        selection?.isCollapsed && element.contains(selection.anchorNode),
                    );
                }),
            )
            .toBe(true);
        await expect(editor.locators.contenteditable).toBeFocused();
    });

    for (const kind of ['Button', 'Link']) {
        test(`New ${kind} accepts text without moving the caret`, async ({mount, page, editor}) => {
            await mount(<HeaderStories.Empty />);
            const header = page.getByTestId('g-md-header');
            await header.locator('.g-md-header-title').click();
            const links = page
                .getByTestId('g-md-toolbar-header')
                .getByRole('button', {name: 'Links', exact: true});
            await expect(links).toBeDisabled();
            await page
                .getByTestId('g-md-toolbar-header')
                .getByRole('button', {name: 'Add button', exact: true})
                .click();
            await page.getByRole('menuitem', {name: kind, exact: true}).click();

            const action = header.locator('.g-md-header-action');
            await expect(links).toBeEnabled();
            await page.keyboard.type('New button label', {delay: 80});
            await expect(action).toHaveText('New button label');

            await action.selectText();
            await page.keyboard.press('Backspace');
            await action.click();
            await page.keyboard.type('Replacement label', {delay: 80});
            await expect(action).toHaveText('Replacement label');
            await expect
                .poll(() =>
                    action.evaluate((element) => {
                        const selection = window.getSelection();
                        return Boolean(
                            selection?.isCollapsed && element.contains(selection.anchorNode),
                        );
                    }),
                )
                .toBe(true);
            await expect(editor.locators.contenteditable).toBeFocused();
            await expect(header.locator('.g-md-header-description')).toHaveText('Description');
        });
    }

    test('Links are editable from the header toolbar', async ({mount, page, expectScreenshot}) => {
        await mount(<HeaderStories.Filled />, {width: 800, hidePlaygroundBlocks: true});
        const header = page.getByTestId('g-md-header');
        const actions = header.locator('.g-md-header-action');
        await header.locator('.g-md-header-title').click();

        const links = page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Links', exact: true});
        await expect(links).toHaveText('Links');
        await links.click();
        const first = page.getByRole('group', {name: 'Начать работу', exact: true});
        const second = page.getByRole('group', {name: 'Смотреть разделы', exact: true});
        const firstInput = first.getByRole('textbox', {name: 'Link URL', exact: true});
        const secondInput = second.getByRole('textbox', {name: 'Link URL', exact: true});
        await expect(firstInput).toBeFocused();
        await expect(firstInput).toHaveValue('/start');
        await expect(secondInput).toHaveValue('/sections');
        await expect(page.getByRole('button', {name: 'Apply', exact: true})).toHaveCount(0);
        await expect(first.getByLabel('Open the link in a new tab', {exact: true})).toHaveAttribute(
            'href',
            '/start',
        );
        await page.mouse.move(0, 0);
        await expectScreenshot();

        await secondInput.fill('https://example.com/sections');
        await secondInput.press('Enter');
        await expect(actions.nth(0)).toHaveAttribute('href', '/start');
        await expect(actions.nth(1)).toHaveAttribute('href', 'https://example.com/sections');

        await links.click();
        await expect(firstInput).toHaveValue('/start');
        await firstInput.fill('/updated');
        await firstInput.press('Enter');
        await expect(actions.nth(0)).toHaveAttribute('href', '/updated');
        await expect(actions.nth(1)).toHaveAttribute('href', 'https://example.com/sections');

        await links.click();
        await first.getByRole('button', {name: 'Remove link', exact: true}).click();
        await expect(actions.nth(0)).not.toHaveAttribute('href');
        await expect(actions.nth(0)).toHaveText('Начать работу');
        await expect(actions.nth(0)).toHaveAttribute('data-type', 'button');
        await expect(actions.nth(1)).toHaveAttribute('href', 'https://example.com/sections');
    });

    test('Links settings follow keyboard selection', async ({mount, page, editor}) => {
        await mount(<HeaderStories.Filled />);
        const header = page.getByTestId('g-md-header');
        const edit = page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Links', exact: true});
        const markup = page.locator('.playground__markup');
        await header.locator('.g-md-header-title').click();
        await expect(edit).toBeEnabled();
        const originalMarkup = await markup.textContent();

        await editor.press('Tab', 3);
        await expect(edit).toBeVisible();
        await expect(markup).toHaveText(originalMarkup!);
        await edit.click();

        const first = page.getByRole('group', {name: 'Начать работу', exact: true});
        const second = page.getByRole('group', {name: 'Смотреть разделы', exact: true});
        const firstInput = first.getByRole('textbox', {name: 'Link URL', exact: true});
        const secondInput = second.getByRole('textbox', {name: 'Link URL', exact: true});
        await expect(secondInput).toBeFocused();
        await expect(secondInput).toHaveValue('/sections');
        await secondInput.fill('/updated-sections');
        const button = second
            .getByRole('group', {name: 'Button kind', exact: true})
            .getByRole('button', {name: 'Button', exact: true});
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await expect(secondInput).toHaveValue('/updated-sections');
        await secondInput.press('Enter');

        const actions = header.locator('.g-md-header-action');
        await expect(actions.nth(0)).toHaveAttribute('href', '/start');
        await expect(actions.nth(1)).toHaveAttribute('data-type', 'button');
        await expect(actions.nth(1)).toHaveAttribute('href', '/updated-sections');
        await expect(editor.locators.contenteditable).toBeFocused();
        await editor.press('Shift+Tab');
        await expect(edit).toBeEnabled();

        await editor.press('Tab');
        await edit.click();
        await expect(secondInput).toBeFocused();
        await expect(secondInput).toHaveValue('/updated-sections');
        await second.getByRole('button', {name: 'Remove button', exact: true}).click();
        await expect(actions).toHaveCount(1);
        await expect(actions).toHaveText('Начать работу');
        await expect(actions).toHaveAttribute('href', '/start');
        await expect(editor.locators.contenteditable).toBeFocused();
        await expect(edit).toBeEnabled();

        await edit.click();
        await expect(firstInput).toHaveValue('/start');
        await firstInput.fill('/discarded');
        await page.keyboard.press('Escape');
        await expect(firstInput).toBeHidden();
        await expect(edit).toBeFocused();
        await expect(actions).toHaveAttribute('href', '/start');
    });

    test('Image URL saves on outside click without moving the caret', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(<HeaderStories.Filled uploadEnabled={false} />);
        const header = page.getByTestId('g-md-header');
        const paragraph = editor.locators.contenteditable.getByText('Обычный абзац под обложкой.', {
            exact: true,
        });
        await header.locator('.g-md-header-title').click();
        await page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Image', exact: true})
            .click();
        const input = page.getByRole('textbox', {name: 'Image URL', exact: true});
        await input.fill('/assets/header-cover.svg');
        await paragraph.click({position: {x: 8, y: 8}});

        await expect(input).toBeHidden();
        await expect(header).toHaveAttribute('data-image', '/assets/header-cover.svg');
        await expect(header).toHaveAttribute('data-bg', 'image');
        await expect
            .poll(() =>
                paragraph.evaluate((element) =>
                    element.contains(window.getSelection()?.anchorNode ?? null),
                ),
            )
            .toBe(true);
        await page.keyboard.press('End');
        await page.keyboard.type(' Continued.');
        await expect(editor.locators.contenteditable.locator('> p').last()).toHaveText(
            'Обычный абзац под обложкой. Continued.',
        );
        await expect(header.locator('.g-md-header-title')).toHaveText('Добро пожаловать на портал');
    });

    test('Link URL saves when clicking another action', async ({mount, page, editor}) => {
        await mount(<HeaderStories.Filled />);
        const header = page.getByTestId('g-md-header');
        const actions = header.locator('.g-md-header-action');
        await actions.first().click();
        await page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Links', exact: true})
            .click();
        const input = page
            .getByRole('group', {name: 'Начать работу', exact: true})
            .getByRole('textbox', {name: 'Link URL', exact: true});
        await input.fill('/saved-on-click');
        await actions.nth(1).click({position: {x: 8, y: 8}});

        await expect(input).toBeHidden();
        await expect(actions.first()).toHaveAttribute('href', '/saved-on-click');
        await expect(actions.nth(1)).toHaveAttribute('href', '/sections');
        await expect
            .poll(() =>
                actions
                    .nth(1)
                    .evaluate((element) =>
                        element.contains(window.getSelection()?.anchorNode ?? null),
                    ),
            )
            .toBe(true);
        await expect(editor.locators.contenteditable).toBeFocused();
        await page.keyboard.press('End');
        await page.keyboard.type(' updated');
        await expect(actions.nth(1)).toHaveText('Смотреть разделы updated');
        await expect(actions.first()).toHaveText('Начать работу');
    });

    test('Tab through link sections commits both URLs only when leaving the popup', async ({
        mount,
        page,
    }) => {
        await mount(<HeaderStories.Filled />);
        const header = page.getByTestId('g-md-header');
        const actions = header.locator('.g-md-header-action');
        await header.locator('.g-md-header-title').click();
        await page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Links', exact: true})
            .click();
        const first = page
            .getByRole('group', {name: 'Начать работу', exact: true})
            .getByRole('textbox', {name: 'Link URL', exact: true});
        const second = page
            .getByRole('group', {name: 'Смотреть разделы', exact: true})
            .getByRole('textbox', {name: 'Link URL', exact: true});

        await first.fill('/first-tab');
        for (let step = 0; step < 10; step++) {
            await page.keyboard.press('Tab');
            if (await second.evaluate((element) => element === document.activeElement)) break;
        }
        await expect(second).toBeFocused();
        await expect(first).toHaveValue('/first-tab');
        await expect(actions.first()).toHaveAttribute('href', '/start');
        await second.fill('/second-tab');

        for (let step = 0; step < 10; step++) {
            await page.keyboard.press('Tab');
            if (!(await first.isVisible())) break;
        }
        await expect(first).toBeHidden();
        await expect(actions.first()).toHaveAttribute('href', '/first-tab');
        await expect(actions.nth(1)).toHaveAttribute('href', '/second-tab');
    });

    test('Undo and redo discard an open URL draft', async ({mount, page, editor}) => {
        await mount(<HeaderStories.Filled />);
        const header = page.getByTestId('g-md-header');
        const action = header.locator('.g-md-header-action').first();
        const links = page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Links', exact: true});
        const input = page
            .getByRole('group', {name: 'Начать работу', exact: true})
            .getByRole('textbox', {name: 'Link URL', exact: true});
        await header.locator('.g-md-header-title').click();
        await links.click();
        await input.fill('/saved');
        await input.press('Enter');
        await expect(action).toHaveAttribute('href', '/saved');

        await links.click();
        await input.fill('/discard-before-undo');
        await editor.clickMainToolbarButton('Undo');
        await expect(input).toBeHidden();
        await expect(action).toHaveAttribute('href', '/start');

        await header.locator('.g-md-header-title').click();
        await links.click();
        await input.fill('/discard-before-redo');
        await editor.clickMainToolbarButton('Redo');
        await expect(input).toBeHidden();
        await expect(action).toHaveAttribute('href', '/saved');
        await expect(header.locator('.g-md-header-action').nth(1)).toHaveAttribute(
            'href',
            '/sections',
        );
    });

    test('Image URL cancellation and removal preserve header content', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(<HeaderStories.BackgroundImage />);
        const header = page.getByTestId('g-md-header');
        const image = page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Image', exact: true});
        const input = page.getByRole('textbox', {name: 'Image URL', exact: true});
        await header.locator('.g-md-header-title').click();
        await image.click();
        await input.fill('/discarded.png');
        await page.keyboard.press('Escape');

        await expect(input).toBeHidden();
        await expect(image).toBeFocused();
        await expect(header).toHaveAttribute('data-image', '/assets/header-cover.svg');
        await image.click();
        await expect(input).toHaveValue('/assets/header-cover.svg');
        await page.getByRole('button', {name: 'Remove image', exact: true}).click();

        await expect(header).toHaveAttribute('data-image', '');
        await expect(header).toHaveAttribute('data-bg', 'fill');
        await expect(header.locator('.g-md-header-title')).toHaveText('HR-департамент');
        await expect(header.locator('.g-md-header-action')).toHaveAttribute('href', '/hr');
        await expect(editor.locators.contenteditable).toBeFocused();
    });

    test('An invalid URL prevents committing either action draft', async ({mount, page}) => {
        await mount(<HeaderStories.Filled />);
        const header = page.getByTestId('g-md-header');
        const actions = header.locator('.g-md-header-action');
        await header.locator('.g-md-header-title').click();
        await page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Links', exact: true})
            .click();
        const dialog = page.getByRole('dialog', {name: 'Links', exact: true});
        const first = dialog
            .getByRole('group', {name: 'Начать работу', exact: true})
            .getByRole('textbox', {name: 'Link URL', exact: true});
        const second = dialog
            .getByRole('group', {name: 'Смотреть разделы', exact: true})
            .getByRole('textbox', {name: 'Link URL', exact: true});
        await first.fill('/pending');
        // eslint-disable-next-line no-script-url
        const invalidUrl = 'javascript:alert(1)';
        await second.fill(invalidUrl);
        await second.press('Enter');

        await expect(dialog).toBeVisible();
        await expect(first).toHaveValue('/pending');
        await expect(second).toHaveValue(invalidUrl);
        await expect(actions.first()).toHaveAttribute('href', '/start');
        await expect(actions.nth(1)).toHaveAttribute('href', '/sections');
        await dialog
            .getByRole('group', {name: 'Начать работу', exact: true})
            .getByRole('button', {name: 'Remove button', exact: true})
            .click();
        await expect(dialog).toBeVisible();
        await expect(actions).toHaveCount(2);
        await expect(first).toHaveValue('/pending');
        await expect(second).toHaveValue(invalidUrl);
        await expect(actions.first()).toHaveAttribute('href', '/start');
        await expect(actions.nth(1)).toHaveAttribute('href', '/sections');
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(actions.first()).toHaveAttribute('href', '/start');
        await expect(actions.nth(1)).toHaveAttribute('href', '/sections');
    });

    test('Removing an action saves the other action URL draft', async ({mount, page, editor}) => {
        await mount(<HeaderStories.Filled />);
        const header = page.getByTestId('g-md-header');
        await header.locator('.g-md-header-title').click();
        await page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Links', exact: true})
            .click();
        const dialog = page.getByRole('dialog', {name: 'Links', exact: true});
        await dialog
            .getByRole('group', {name: 'Смотреть разделы', exact: true})
            .getByRole('textbox', {name: 'Link URL', exact: true})
            .fill('/kept');
        await dialog
            .getByRole('group', {name: 'Начать работу', exact: true})
            .getByRole('button', {name: 'Remove button', exact: true})
            .click();

        const actions = header.locator('.g-md-header-action');
        await expect(dialog).toBeHidden();
        await expect(actions).toHaveCount(1);
        await expect(actions).toHaveText('Смотреть разделы');
        await expect(actions).toHaveAttribute('href', '/kept');
        await expect(actions).toHaveAttribute('data-type', 'link');
        await expect(editor.locators.contenteditable).toBeFocused();
    });

    test('Header dialogs fit a narrow viewport', async ({mount, page}) => {
        const viewport = {width: 375, height: 800};
        await page.setViewportSize(viewport);
        await mount(<HeaderStories.Filled />, {
            width: viewport.width - 40,
            hidePlaygroundBlocks: true,
        });
        await page.getByTestId('g-md-header').locator('.g-md-header-title').click();
        const toolbar = page.getByTestId('g-md-toolbar-header');

        for (const name of ['Appearance', 'Image', 'Links']) {
            const trigger = toolbar.getByRole('button', {name, exact: true});
            await trigger.click();
            const dialog = page.getByRole('dialog', {name, exact: true});
            await expect(dialog).toBeVisible();
            await expect
                .poll(async () => {
                    const bounds = await dialog.boundingBox();
                    return Boolean(
                        bounds &&
                        bounds.x >= 0 &&
                        bounds.y >= 0 &&
                        bounds.x + bounds.width <= viewport.width,
                    );
                })
                .toBe(true);
            await expect
                .poll(() =>
                    page.evaluate(
                        () =>
                            document.documentElement.scrollWidth <=
                            document.documentElement.clientWidth,
                    ),
                )
                .toBe(true);
            await page.keyboard.press('Escape');
            await expect(dialog).toBeHidden();
            await expect(trigger).toBeFocused();
        }
    });
});
