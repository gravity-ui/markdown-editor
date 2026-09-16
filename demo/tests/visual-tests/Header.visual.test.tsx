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
        const size = page.getByRole('combobox', {name: 'Size', exact: true});
        await expect(size).toBeVisible();

        await page.mouse.move(0, 0);
        await expectScreenshot();

        await size.click();
        await page.getByRole('option', {name: 'Compact', exact: true}).click();
        await expect(header).toHaveAttribute('data-format', 'small');
        await expect(size).toBeVisible();
        await expect(size).toContainText('Compact');
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

        await page.mouse.move(0, 0);
        await expectScreenshot();
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
        const target = page.getByRole('combobox', {name: 'Button or link', exact: true});
        const input = page.getByRole('textbox', {name: 'Link URL', exact: true});
        await expect(target).toContainText('Начать работу');
        await expect(input).toBeFocused();
        await expect(input).toHaveValue('/start');
        await page.mouse.move(0, 0);
        await expectScreenshot();

        await target.click();
        await page.getByRole('option', {name: '2. Смотреть разделы', exact: true}).click();
        await expect(input).toHaveValue('/sections');
        await expect(input).toBeFocused();
        await input.fill('https://example.com/sections');
        await page.getByRole('button', {name: 'Apply', exact: true}).click();
        await expect(actions.nth(0)).toHaveAttribute('href', '/start');
        await expect(actions.nth(1)).toHaveAttribute('href', 'https://example.com/sections');

        await links.click();
        await expect(input).toHaveValue('/start');
        await input.fill('/updated');
        await input.press('Enter');
        await expect(actions.nth(0)).toHaveAttribute('href', '/updated');
        await expect(actions.nth(1)).toHaveAttribute('href', 'https://example.com/sections');

        await links.click();
        await expect(input).toHaveValue('/updated');
        await input.fill('');
        await input.press('Enter');
        await expect(actions.nth(0)).not.toHaveAttribute('href');
        await expect(actions.nth(0)).toHaveText('Начать работу');
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

        await editor.press('Tab', 2);
        await expect(edit).toBeVisible();
        await expect(markup).toHaveText(originalMarkup!);
        await edit.click();

        const input = page.getByRole('textbox', {name: 'Link URL', exact: true});
        await expect(input).toBeFocused();
        await expect(input).toHaveValue('/start');
        await input.fill('/updated');
        await page.getByRole('combobox', {name: 'Button kind', exact: true}).click();
        await page.getByRole('option', {name: 'Link', exact: true}).click();
        await expect(input).toHaveValue('/updated');
        await input.press('Enter');

        const actions = header.locator('.g-md-header-action');
        await expect(actions.nth(0)).toHaveAttribute('href', '/updated');
        await expect(actions.nth(0)).toHaveAttribute('data-type', 'link');
        await expect(actions.nth(1)).toHaveAttribute('href', '/sections');
        await expect(editor.locators.contenteditable).toBeFocused();
        await editor.press('Shift+Tab');
        await expect(edit).toBeEnabled();

        await editor.press('Tab', 2);
        await edit.click();
        await expect(input).toHaveValue('/sections');
        await page.getByRole('button', {name: 'Remove button', exact: true}).click();
        await expect(actions).toHaveCount(1);
        await expect(actions).toHaveText('Начать работу');
        await expect(actions).toHaveAttribute('href', '/updated');
        await expect(editor.locators.contenteditable).toBeFocused();
        await expect(edit).toBeEnabled();

        await edit.click();
        await expect(input).toHaveValue('/updated');
        await input.fill('/discarded');
        await page.keyboard.press('Escape');
        await expect(input).toBeHidden();
        await expect(edit).toBeFocused();
        await expect(actions).toHaveAttribute('href', '/updated');
    });
});
