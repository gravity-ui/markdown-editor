import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Cut', () => {
    test.beforeEach(async ({mount}) => {
        const initialMarkup = dd`
            ## YFM Cut

            {% cut "Cut header" %}

            Content displayed when clicked.

            {% endcut %}

            {% cut "Cut with nested сut header" %}

            {% cut "Cut inside cut header" %}

            Content displayed when clicked.

            {% endcut %}

            {% endcut %}
        `;

        await mount(<Playground initial={initialMarkup} />);
    });

    test('should open second cut', async ({expectScreenshot, editor, page}) => {
        await editor.switchMode('wysiwyg');

        const nestedCut = page.getByText('Cut with nested сut header').first().locator('..');
        await expect(nestedCut).toBeVisible();

        // Clicking by MouseEvent because YfmCutController relies on event bubbling to document
        // https://github.com/diplodoc-platform/cut-extension/blob/master/src/runtime/controller.ts#L9
        await nestedCut.dispatchEvent('click', {
            bubbles: true,
            cancelable: true,
            composed: true,
        });
        await page.waitForTimeout(100);

        await expectScreenshot();
    });

    test('should cut inside open second cut', async ({expectScreenshot, editor, page}) => {
        await editor.switchMode('wysiwyg');

        const nestedCut = page.getByText('Cut with nested сut header').first().locator('..');
        await expect(nestedCut).toBeVisible();

        await nestedCut.dispatchEvent('click', {
            bubbles: true,
            cancelable: true,
            composed: true,
        });
        await page.waitForTimeout(100);

        // click to cut inside
        const cutInsideNestedCut = page.getByText('Cut inside cut header').first().locator('..');
        await expect(cutInsideNestedCut).toBeVisible();

        await cutInsideNestedCut.dispatchEvent('click', {
            bubbles: true,
            cancelable: true,
            composed: true,
        });
        await page.waitForTimeout(100);

        await expectScreenshot();
    });

    test('should open second cut in preview', async ({editor, page, expectScreenshot}) => {
        await editor.switchPreview('visible');

        const nestedCut = page.getByText('Cut with nested сut header').first().locator('..');
        await expect(nestedCut).toBeVisible();

        await nestedCut.click();
        await page.waitForTimeout(100);

        await expectScreenshot();
    });
});
