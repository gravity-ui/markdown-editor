import {expect, test} from '@playwright/experimental-ct-react';

import {ResourceReplacementStatusExample} from './ResourceReplacementStatus.helpers';

for (const mode of ['wysiwyg', 'markup'] as const) {
    for (const configuration of ['default', 'custom', 'mobile'] as const) {
        test(`should keep one ${mode} indicator visible until all requests finish with a ${configuration} toolbar`, async ({
            mount,
            page,
        }) => {
            await mount(
                <ResourceReplacementStatusExample
                    mode={mode}
                    customToolbar={configuration === 'custom'}
                    mobile={configuration === 'mobile'}
                />,
            );
            const status = page.locator('[data-qa="g-md-resource-replacement-status"]');
            await expect(status).toHaveCount(0);
            const editor = page.locator(mode === 'wysiwyg' ? '.ProseMirror' : '.cm-content');
            const paste = () =>
                editor.evaluate((element) => {
                    const data = new DataTransfer();
                    data.setData('text/yfm', '![label](/assets/test-image.jpg)');
                    element.dispatchEvent(
                        Object.assign(new Event('paste', {bubbles: true, cancelable: true}), {
                            clipboardData: data,
                        }),
                    );
                });
            await paste();
            await expect(status).toBeVisible();
            await paste();
            await expect(status).toHaveCount(1);
            expect(
                await status.evaluate(
                    (element) => element.parentElement?.firstElementChild === element,
                ),
            ).toBe(true);
            await page
                .locator('.g-md-flex-toolbar__bar')
                .first()
                .evaluate((element) => {
                    element.scrollLeft = element.scrollWidth;
                });
            await expect(status).toBeInViewport();
            await page.getByRole('button', {name: 'Cancel first request'}).click();
            await expect(status).toBeVisible();
            await page.getByRole('button', {name: 'Complete last request'}).click();
            await expect(status).toHaveCount(0);
        });
    }
}
