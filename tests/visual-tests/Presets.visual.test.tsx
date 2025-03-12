import {test} from 'playwright/core';

import {Commonmark, Custom, Default, Full, Yfm, Zero} from './helpers';

test.describe('Extensions, Presets', () => {
    test('Zero', async ({mount, expectScreenshot}) => {
        await mount(<Zero />);
        await expectScreenshot();
    });
    test('Common Mark', async ({mount, expectScreenshot}) => {
        await mount(<Commonmark />);
        await expectScreenshot();
    });
    test('Default', async ({mount, expectScreenshot}) => {
        await mount(<Default />);
        await expectScreenshot();
    });
    test('YFM', async ({mount, expectScreenshot}) => {
        await mount(<Yfm />);
        await expectScreenshot();
    });
    test('Full', async ({mount, expectScreenshot}) => {
        await mount(<Full />);
        await expectScreenshot();
    });
    test('Custom', async ({mount, expectScreenshot}) => {
        await mount(<Custom />);
        await expectScreenshot();
    });
});
