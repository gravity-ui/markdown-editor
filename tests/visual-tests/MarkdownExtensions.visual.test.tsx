import {test} from 'playwright/core';

import {
    Blockquotes,
    Code,
    DefinitionList,
    Emojis,
    Emphasis,
    Heading,
    HorizontalRules,
    Images,
    Links,
    Lists,
    SubscriptSuperscript,
    Tables,
} from './MarkdownExtensions.helpers';

test.describe('Extensions, Markdown', () => {
    test('Heading', async ({mount, expectScreenshot}) => {
        await mount(<Heading />);
        await expectScreenshot();
    });
    test('Blockquotes', async ({mount, expectScreenshot}) => {
        await mount(<Blockquotes />);
        await expectScreenshot();
    });
    test('Emphasis', async ({mount, expectScreenshot}) => {
        await mount(<Emphasis />);
        await expectScreenshot();
    });
    test('Horizontal Rules', async ({mount, expectScreenshot}) => {
        await mount(<HorizontalRules />);
        await expectScreenshot();
    });
    test('Lists', async ({mount, expectScreenshot}) => {
        await mount(<Lists />);
        await expectScreenshot();
    });
    test('Code', async ({mount, expectScreenshot}) => {
        await mount(<Code />);
        await expectScreenshot();
    });
    test('Tables', async ({mount, expectScreenshot}) => {
        await mount(<Tables />);
        await expectScreenshot();
    });
    test('Links', async ({mount, expectScreenshot}) => {
        await mount(<Links />);
        await expectScreenshot();
    });
    test('Images', async ({mount, expectScreenshot}) => {
        await mount(<Images />);
        await expectScreenshot();
    });
    test('Subscript & Superscript', async ({mount, expectScreenshot}) => {
        await mount(<SubscriptSuperscript />);
        await expectScreenshot();
    });
    test('Emojis', async ({mount, expectScreenshot}) => {
        await mount(<Emojis />);
        await expectScreenshot();
    });
    test('Definition list', async ({mount, expectScreenshot}) => {
        await mount(<DefinitionList />);
        await expectScreenshot();
    });
});
