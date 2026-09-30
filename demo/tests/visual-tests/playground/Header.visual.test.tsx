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

test('should omit the crop control for a header with an image', async ({mount, page}) => {
    await mount(<HeaderDemo markupKey="layers" />);
    await page.locator('.g-md-header').filter({hasText: 'На всю площадь'}).click();

    const toolbar = page.getByTestId('g-md-toolbar-header');
    await expect(toolbar).toBeVisible();
    await expect(toolbar.getByRole('button', {name: 'Crop'})).toHaveCount(0);
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
