import {expect, test} from 'playwright/core';

import {AttachmentForm} from './AttachmentForms.helpers';

for (const kind of ['file', 'image'] as const) {
    test(`should switch ${kind} insertion from upload to link`, async ({
        mount,
        expectScreenshot,
    }) => {
        const component = await mount(<AttachmentForm kind={kind} />, {width: 400});
        const tabs = component.getByRole('tab');
        await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
        await expectScreenshot({component, nameSuffix: 'upload'});

        await tabs.nth(1).click();
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
        await expect(component.getByPlaceholder('https://')).toBeVisible();
        await expectScreenshot({component, nameSuffix: 'link'});
    });
}
