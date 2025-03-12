import {test} from 'playwright/core';

import {PlaygroundMini} from '../../demo/components/PlaygroundMini';
import {markup} from '../../demo/stories/markdown/markup';

test.describe('Extensions, Markdown', () => {
    test('Heading', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.heading} />);
        await expectScreenshot();
    });
    test('Blockquotes', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.blockquote} />);
        await expectScreenshot();
    });
    test('Emphasis', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.emphasis} />);
        await expectScreenshot();
    });
    test('Horizontal Rules', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.horizontalRules} />);
        await expectScreenshot();
    });
    test('Lists', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.lists} />);
        await expectScreenshot();
    });
    test('Code', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.code} />);
        await expectScreenshot();
    });
    test('Tables', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.tables} />);
        await expectScreenshot();
    });
    test('Links', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.links} />);
        await expectScreenshot();
    });
    test('Images', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.images} />);
        await expectScreenshot();
    });
    test('Subscript & Superscript', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.subAndSub} />);
        await expectScreenshot();
    });
    test('Emojis', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.emojis} />);
        await expectScreenshot();
    });
    test('Definition list', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.deflist} />);
        await expectScreenshot();
    });
});
