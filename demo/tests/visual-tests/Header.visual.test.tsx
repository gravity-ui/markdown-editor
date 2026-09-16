import {test} from 'playwright/core';

import {HeaderStories} from './Header.helpers';

// Весь смысл блока визуальный, поэтому каждое сочетание оформления закрыто снимком, а не
// проверкой атрибутов: юнит-тесты не поймают ни съехавшую вуаль, ни потерянный контраст.
test.describe('Extensions, Header', () => {
    test('Empty', async ({mount, expectScreenshot}) => {
        await mount(<HeaderStories.Empty />);
        await expectScreenshot();
    });

    test('Title, subtitle and buttons', async ({mount, expectScreenshot}) => {
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
});
