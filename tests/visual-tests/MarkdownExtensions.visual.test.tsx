import {test} from 'playwright/core';

import {MarkdownStories} from './MarkdownExtensions.helpers';

test.describe('Extensions, Markdown', () => {
    test('Heading', async ({mount, expectScreenshot}) => {
        await mount(<MarkdownStories.Heading />);
        await expectScreenshot();
    });
    test('Blockquotes', async ({mount, expectScreenshot}) => {
        await mount(<MarkdownStories.Blockquote />);
        await expectScreenshot();
    });
    test('Emphasis', async ({mount, expectScreenshot}) => {
        await mount(<MarkdownStories.Emphasis />);
        await expectScreenshot();
    });
    test('Horizontal Rules', async ({mount, expectScreenshot}) => {
        await mount(<MarkdownStories.HorizontalRules />);
        await expectScreenshot();
    });
    test('Lists', async ({mount, expectScreenshot}) => {
        await mount(<MarkdownStories.Lists />);
        await expectScreenshot();
    });
    test('Code', async ({mount, expectScreenshot}) => {
        await mount(<MarkdownStories.Code />);
        await expectScreenshot();
    });
    test('Tables', async ({mount, expectScreenshot}) => {
        await mount(<MarkdownStories.Tables />);
        await expectScreenshot();
    });
    test('Links', async ({mount, expectScreenshot}) => {
        await mount(<MarkdownStories.Links />);
        await expectScreenshot();
    });
    test('Images', async ({mount, expectScreenshot}) => {
        await mount(<MarkdownStories.Images />);
        await expectScreenshot();
    });
    test('Subscript & Superscript', async ({mount, expectScreenshot}) => {
        await mount(<MarkdownStories.SubSup />);
        await expectScreenshot();
    });
    test('Emojis', async ({mount, expectScreenshot}) => {
        await mount(<MarkdownStories.Emojis />);
        await expectScreenshot();
    });
    test('Definition list', async ({mount, expectScreenshot}) => {
        await mount(<MarkdownStories.DefinitionList />);
        await expectScreenshot();
    });
});
