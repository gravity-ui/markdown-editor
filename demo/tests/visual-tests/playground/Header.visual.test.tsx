import {expect, test} from 'playwright/core';

import {HeaderDemo} from '../../../src/stories/examples/header/Header';

test('should show every header color and apply the selected fill', async ({mount, page}) => {
    await mount(<HeaderDemo markupKey="backgrounds" />);
    const header = page.locator('.g-md-header').filter({hasText: 'Сплошная заливка'});
    await header.click();

    const toolbar = page.getByTestId('g-md-toolbar-header');
    await toolbar.getByRole('button', {name: 'Color'}).click();

    const palette = page.getByRole('grid', {name: 'Color'});
    await expect(palette.getByRole('button')).toHaveCount(12);
    await expect(palette.locator('.g-palette__row')).toHaveCount(3);
    await expect(palette.locator('.g-palette__row').first().getByRole('button')).toHaveCount(4);
    await expect(palette.locator('[data-fill="blue"]')).toHaveCSS(
        'background-color',
        'rgb(91, 126, 255)',
    );
    await expect(palette.getByRole('button', {name: 'Yellow'})).toHaveAttribute(
        'aria-pressed',
        'true',
    );

    await palette.getByRole('button', {name: 'Red'}).click();
    await expect(header).toHaveAttribute('data-fill', 'red');
});

test('should offer image effects beside the image button without framing controls', async ({
    mount,
    page,
}) => {
    await mount(<HeaderDemo markupKey="layers" />);
    const header = page.locator('.g-md-header').filter({hasText: 'На всю площадь'});
    await header.click();

    const toolbar = page.getByTestId('g-md-toolbar-header');
    await expect(toolbar).toBeVisible();
    await expect(toolbar.getByRole('button', {name: 'Crop'})).toHaveCount(0);
    await expect(toolbar.getByRole('button', {name: 'Image', exact: true})).toHaveCount(0);

    await toolbar.getByRole('button', {name: 'Image effects'}).click();
    await page.getByRole('menuitem', {name: 'Darken'}).click();
    await expect(header).toHaveAttribute('data-effect', 'darken');
});

test('should offer pattern size for a patterned background', async ({mount, page}) => {
    await mount(<HeaderDemo markupKey="backgrounds" />);
    await page.locator('.g-md-header').filter({hasText: 'Паттерн'}).click();

    await expect(
        page.getByTestId('g-md-toolbar-header').getByRole('button', {name: 'Pattern size'}),
    ).toBeVisible();
});

test('should show the title, subtitle and two actions', async ({mount, page}) => {
    await mount(<HeaderDemo markupKey="content" />);
    const header = page.locator('.g-md-header');
    await expect(header.locator('.g-md-header__title')).toHaveText('Портал команды Вики');
    await expect(header.locator('.header_content')).toContainText('Релизы, дежурства, контакты.');
    await expect(header.locator('.g-md-header__action')).toHaveCount(2);
});

test('should render the complete cover', async ({mount, expectScreenshot}) => {
    await mount(<HeaderDemo markupKey="content" />);
    await expectScreenshot();
});

test('should apply a color to the second gradient fill', async ({mount, page}) => {
    await mount(<HeaderDemo markupKey="angles" />);
    const header = page.locator('.g-md-header').first();
    await header.click();

    await page.getByTestId('g-md-toolbar-header').getByRole('button', {name: 'Color'}).click();
    await page.getByRole('radio', {name: 'Secondary'}).click();
    await page.getByRole('grid', {name: 'Color'}).getByRole('button', {name: 'Red'}).click();

    await expect(header).toHaveAttribute('data-fill2', 'red');
});
