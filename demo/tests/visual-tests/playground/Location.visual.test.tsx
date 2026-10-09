import {decompressFromEncodedURIComponent} from 'lz-string';

import {expect, test} from 'playwright/core';

import {UrlSyncPlayground} from './Location.helpers';
import {Playground} from './Playground.helpers';

test.describe('Playground URL', () => {
    test.beforeEach(async ({page}) => {
        await page.clock.install();
    });

    test('should keep the URL unchanged when synchronization is disabled', async ({
        mount,
        page,
    }) => {
        await mount(<Playground initial="some text" />);
        const url = page.url();
        await page.evaluate(() => window.mdEditor?.replace('changed text'));
        await expect(page.locator('.playground__markup')).toHaveText('changed text');
        await page.clock.runFor(1000);
        expect(page.url()).toBe(url);
        expect(new URL(page.url()).searchParams.has('markup')).toBe(false);
    });

    test('should synchronize a compressed HTML block when enabled', async ({mount, page}) => {
        const markup = '{% html %}\n' + '<div>Привет 🌍</div>\n'.repeat(100) + '{% endhtml %}';
        await mount(<Playground initial={markup} initialEditor="markup" syncMarkupToUrl />);
        await page.clock.runFor(1000);
        await expect(page).toHaveURL(/[?&]markup=lz%3A/);
        const encoded = new URL(page.url()).searchParams.get('markup') ?? '';
        expect(decompressFromEncodedURIComponent(encoded.slice(3))).toBe(markup);
    });

    test('should cancel a pending URL update when synchronization is disabled', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(<UrlSyncPlayground />);
        await page.clock.runFor(1000);
        const url = page.url();
        await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
        await page.getByRole('button', {name: 'Replace markup'}).dispatchEvent('click');
        await page.clock.runFor(100);
        await expect(editor.getByTextInContenteditable('pending text')).toBeVisible();
        await page
            .getByRole('button', {name: 'Disable URL synchronization'})
            .dispatchEvent('click');
        await page.clock.runFor(1000);
        expect(page.url()).toBe(url);
    });

    test('should cancel a pending URL update when the playground is unmounted', async ({
        mount,
        page,
        editor,
    }) => {
        const component = await mount(<UrlSyncPlayground />);
        await page.clock.runFor(1000);
        const url = page.url();
        await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
        await page.getByRole('button', {name: 'Replace markup'}).dispatchEvent('click');
        await page.clock.runFor(100);
        await expect(editor.getByTextInContenteditable('pending text')).toBeVisible();
        await component.unmount();
        await page.clock.runFor(1000);
        expect(page.url()).toBe(url);
    });
});
