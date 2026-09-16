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

    test('Action link editing follows keyboard selection', async ({mount, page, editor}) => {
        await mount(<HeaderStories.Filled />);
        const header = page.getByTestId('g-md-header');
        const edit = page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Edit button', exact: true});
        const markup = page.locator('.playground__markup');
        await header.locator('.g-md-header-title').click();
        await expect(edit).toHaveCount(0);
        const originalMarkup = await markup.textContent();

        await editor.press('Tab', 2);
        await expect(edit).toBeVisible();
        await expect(markup).toHaveText(originalMarkup!);
        await edit.click();

        const input = page.getByRole('textbox', {name: 'Link', exact: true});
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
        await expect(edit).toHaveCount(0);

        await editor.press('Tab');
        await edit.click();
        await expect(input).toHaveValue('/updated');
        await page.getByRole('button', {name: 'Remove button', exact: true}).click();
        await expect(actions).toHaveCount(1);
        await expect(actions).toHaveText('Смотреть разделы');
        await expect(actions).toHaveAttribute('href', '/sections');
        await expect(editor.locators.contenteditable).toBeFocused();
        await expect(edit).toHaveCount(0);
    });
});
