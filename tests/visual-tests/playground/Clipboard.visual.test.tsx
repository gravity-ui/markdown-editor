import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Clipboard', () => {
    test.beforeEach(async ({mount, editor}) => {
        await mount(<Playground markupParseHtmlOnPaste />);
        await editor.clearContentAndSwitchMode('wysiwyg');
    });

    const emphasisMarkup = dd`
    ## Emphasis

    **This is bold text**

    *This is italic text*

    ~~Strikethrough~~
    `;

    test('should copy from wysiwyg and paste formatted to markup mode', async ({
        browserName,
        expectScreenshot,
        helpers: {keys},
        editor,
        page,
    }) => {
        test.skip(browserName === 'webkit', 'Clipboard does not work correctly in webkit');

        await editor.switchMode('wysiwyg');
        await editor.paste(emphasisMarkup);
        await editor.press(keys.selectAll);
        await editor.press(keys.copy);
        await editor.clearContentAndSwitchMode('markup');
        await editor.press(keys.paste);

        await page.waitForTimeout(500);
        await expectScreenshot();
    });

    test('should copy from markup mode and paste formatted to wysiwyg', async ({
        expectScreenshot,
        browserName,
        helpers: {keys},
        editor,
        wait,
    }) => {
        test.skip(browserName === 'webkit', 'Clipboard does not work correctly in webkit');

        await editor.switchMode('markup');
        await editor.paste(emphasisMarkup);
        await editor.press(keys.selectAll);
        await editor.press(keys.copy);
        await editor.clearContentAndSwitchMode('wysiwyg');
        await editor.press(keys.paste);

        await wait.timeout(500);
        await expectScreenshot();
    });

    test.describe('WYSIWYG mode', () => {
        test.beforeEach(async ({editor}) => {
            await editor.switchMode('wysiwyg');
        });

        test('should copy and paste with preserve markup', async ({
            helpers: {keys},
            editor,
            expectScreenshot,
            wait,
        }) => {
            await editor.paste(emphasisMarkup);
            await editor.press(keys.selectAll);
            await editor.press(keys.copy);
            await editor.press('ArrowRight');
            await editor.press('Enter');
            await editor.press(keys.paste);

            await wait.timeout(500);
            await expectScreenshot();
        });

        test.describe('Copy', () => {
            test('should set data to clipboard buffer', async ({
                editor,
                helpers,
                browserName,
                platform,
            }) => {
                test.skip(
                    browserName === 'webkit' && platform === 'linux',
                    'Skip in webkit on linux, see https://github.com/microsoft/playwright/issues/34307',
                );

                await editor.paste('## Lorem *ipsum* __dolor__ ~~sit~~ amet');
                await editor.press(helpers.keys.selectAll);
                await editor.press(helpers.keys.copy);

                const data = await helpers.getClipboardData();

                expect(data).toStrictEqual({
                    'text/plain': 'Lorem ipsum dolor sit amet',
                    'text/html':
                        '<h2 data-pm-slice="1 1 []">Lorem <em data-markup="*">ipsum</em> <strong data-markup="__">dolor</strong> <strike>sit</strike> amet</h2>',
                });
            });
        });

        test.describe('Cut', () => {
            test('should set data to clipboard buffer', async ({
                editor,
                helpers,
                browserName,
                platform,
            }) => {
                test.skip(
                    browserName === 'webkit' && platform === 'linux',
                    'Skip in webkit on linux, see https://github.com/microsoft/playwright/issues/34307',
                );

                await editor.paste('## Lorem _ipsum_ **dolor** ~~sit~~ amet');
                await editor.press(helpers.keys.selectAll);
                await editor.press(helpers.keys.cut);

                const data = await helpers.getClipboardData();

                expect(data).toStrictEqual({
                    'text/plain': 'Lorem ipsum dolor sit amet',
                    'text/html':
                        '<h2 data-pm-slice="1 1 []">Lorem <em data-markup="_">ipsum</em> <strong data-markup="**">dolor</strong> <strike>sit</strike> amet</h2>',
                });
            });
        });

        test.describe('Paste', () => {
            test('should parse markdown markup', async ({page, editor, expectScreenshot}) => {
                await editor.paste({
                    'text/plain': 'Lorem ipsum dolor sit amet',
                    'text/yfm': '## Lorem *ipsum* **dolor** ~~sit~~ amet',
                });

                await page.waitForTimeout(500);
                await expectScreenshot();
            });

            test('should parse pasting text as markdown markup', async ({
                page,
                editor,
                expectScreenshot,
            }) => {
                await editor.paste('## Lorem *ipsum* **dolor** ~~sit~~ amet');

                await page.waitForTimeout(500);
                await expectScreenshot();
            });

            test('should wrap text to link from clipboard', async ({
                page,
                editor,
                expectScreenshot,
            }) => {
                await editor.fill('Gravity UI');
                await editor.selectTextIn('p');
                await editor.paste('https://gravity-ui.com/');
                await editor.blur();

                await page.waitForTimeout(500);
                await expectScreenshot();
            });

            test('should paste to code block without as is', async ({
                editor,
                page,
                expectScreenshot,
            }) => {
                await editor.fill('```');
                await editor.paste('## Lorem *ipsum* **dolor** ~~sit~~ amet');
                await editor.blur();

                await page.waitForTimeout(500);
                await expectScreenshot();
            });

            test('should replace selected text from code block with link as text', async ({
                editor,
                page,
                expectScreenshot,
            }) => {
                await editor.fill('```');
                await editor.fill('Lorem ipsum dolor sit amet');
                await editor.selectTextIn('pre code');
                await editor.paste('https://gravity-ui.com/');
                await editor.blur();

                await page.waitForTimeout(500);
                await expectScreenshot();
            });

            test('should insert into inline code without formatting', async ({
                editor,
                page,
                expectScreenshot,
            }) => {
                await editor.paste('`Code:`');
                await editor.press('ArrowLeft');
                await editor.press('Space');

                await editor.paste('## Lorem *ipsum* **dolor** ~~sit~~ amet');
                await editor.blur();

                await page.waitForTimeout(500);
                await expectScreenshot();
            });

            test('should insert link from ios safari share button', async ({
                editor,
                page,
                expectScreenshot,
            }) => {
                await editor.paste({
                    'text/uri-list': 'https://gravity-ui.com/',
                });
                await editor.blur();

                await page.waitForTimeout(500);
                await expectScreenshot();
            });
        });
    });

    test.describe('MARKUP mode', () => {
        test.beforeEach(async ({editor}) => {
            await editor.switchMode('markup');
        });

        test('should reindent pasted markup', async ({editor, expectScreenshot}) => {
            await editor.paste('- first\n- second');
            await editor.press('Enter');
            await editor.paste('> This\n> is\n> qoute');
            await editor.blur();
            await expectScreenshot();
        });

        test('should paste link to image as image markup', async ({editor, expectScreenshot}) => {
            await editor.paste('https://example.com/test_img.png');
            await editor.blur();
            await expectScreenshot();
        });
    });

    test.describe('Paste HTML', () => {
        const HTML = dd`
        <div>
        <h2>Heading</h2>
        <p><em>Description</em></p>
        <blockquote>
        <p>This is qoute</p>
        </blockquote>
        <ul>
        <li>first item</li>
        <li>second item</li>
        </ul>
        </div>`;

        test('should parse HTML in wysiwyg mode', async ({editor, expectScreenshot, wait}) => {
            await editor.paste({'text/html': HTML});
            await editor.blur();
            await wait.timeout(500);
            await expectScreenshot();
        });

        test('should parse HTML in markup mode', async ({editor, expectScreenshot, wait}) => {
            await editor.switchMode('markup');
            await editor.paste({'text/html': HTML});
            await editor.blur();
            await wait.timeout(500);
            await expectScreenshot();
        });
    });
});
