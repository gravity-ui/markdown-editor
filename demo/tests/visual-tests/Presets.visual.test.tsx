import {test} from 'playwright/core';

import {PresetsStories} from './Presets.helpers';

test.describe('Extensions, Presets', () => {
    test('Zero', async ({mount, expectScreenshot}) => {
        await mount(<PresetsStories.Zero />);
        await expectScreenshot();
    });
    test('Common Mark', async ({mount, expectScreenshot}) => {
        await mount(<PresetsStories.CommonMark />);
        await expectScreenshot();
    });
    test('Default', async ({mount, expectScreenshot}) => {
        await mount(<PresetsStories.Default />);
        await expectScreenshot();
    });
    test('YFM', async ({mount, expectScreenshot}) => {
        await mount(<PresetsStories.YFM />);
        await expectScreenshot();
    });
    test('Full', async ({mount, expectScreenshot}) => {
        await mount(<PresetsStories.Full />);
        await expectScreenshot();
    });
    test('Custom', async ({mount, expectScreenshot}) => {
        await mount(<PresetsStories.Custom />);
        await expectScreenshot();
    });
});
