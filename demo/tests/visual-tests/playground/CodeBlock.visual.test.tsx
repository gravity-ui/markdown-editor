import dd from 'ts-dedent';

import {test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('CodeBlock', () => {
    test('should insert empty codeblock @wysiwyg', async ({
        mount,
        editor,
        wait,
        expectScreenshot,
    }) => {
        await mount(
            <Playground
                initial=""
                wysiwygConfig={{
                    extensionOptions: {
                        codeBlock: {
                            lineNumbers: {enabled: false},
                            lineWrapping: {enabled: false},
                        },
                    },
                }}
            />,
        );
        await editor.switchMode('wysiwyg');

        await editor.focus();
        await editor.inputRule('```');

        await wait.visible(editor.locators.contenteditable.locator('code'));
        await editor.codeBlock.waitForToolbarVisible();

        await wait.timeout(100);
        await expectScreenshot();
    });

    test.describe('with highlighting', () => {
        test.beforeEach(async ({wait, editor, mount}) => {
            const markup = dd`
                &nbsp;

                ~~~js
                import React from 'react';
                import { useMarkdownEditor, MarkdownEditorView } from '@gravity-ui/markdown-editor';
                import { toaster } from '@gravity-ui/uikit/toaster-singleton';
                ~~~
                `;

            await mount(
                <Playground
                    width={500}
                    initial={markup}
                    wysiwygConfig={{
                        extensionOptions: {
                            codeBlock: {
                                lineNumbers: {enabled: true},
                                lineWrapping: {enabled: true},
                            },
                        },
                    }}
                />,
            );
            await editor.switchMode('wysiwyg');
            await wait.timeout(200); // waiting for highlightjs to load asynchronously
            await editor.focus();
            await editor.press('ArrowDown'); // move cursor to codeblock
            await editor.codeBlock.waitForToolbarVisible();
        });

        test('should highlight codeblock @wysiwyg', async ({expectScreenshot}) => {
            await expectScreenshot();
        });

        test('should wrap text lines @wysiwyg', async ({editor, page, wait, expectScreenshot}) => {
            await editor.codeBlock.clickCodeBlockToolbarButton('Text wrapping');
            await page.mouse.move(-1, -1);
            await wait.timeout(100);
            await expectScreenshot();
        });

        test('should add line numbers @wysiwyg', async ({editor, page, wait, expectScreenshot}) => {
            await editor.codeBlock.clickCodeBlockToolbarButton('Line numbers');
            await page.mouse.move(-1, -1);
            await wait.timeout(100);
            await expectScreenshot();
        });

        test('should wrap text lines with line numbers @wysiwyg', async ({
            editor,
            page,
            wait,
            expectScreenshot,
        }) => {
            test.skip(true, "For some reason, the .wrap classname isn't added to the code element");
            await editor.codeBlock.clickCodeBlockToolbarButton('Line numbers');
            await wait.timeout(100);
            await editor.codeBlock.clickCodeBlockToolbarButton('Text wrapping');
            await page.mouse.move(-1, -1);
            await wait.timeout(100);
            await expectScreenshot();
        });

        test('should remove codeblock @wysiwyg', async ({editor, wait}) => {
            await editor.codeBlock.clickCodeBlockToolbarButton('Remove');
            await editor.codeBlock.waitForToolbarHidden();
            await wait.hidden(editor.locators.contenteditable.locator('code'));
        });
    });
});
