import {expect, test} from '@playwright/experimental-ct-react';

import {PasteResources} from './PasteResources.helpers';

test('Resource image loading failure after reopening preserves the original resource', async ({
    mount,
    page,
}) => {
    await page.route('**/assets/unavailable-image.jpg', (route) =>
        route.fulfill({status: 404, body: 'missing'}),
    );
    const original = '![original](/assets/unavailable-image.jpg)';
    await mount(<PasteResources initialMarkup={original} />);
    const image = page.locator('.ProseMirror [data-qa="g-md-image"] img');
    // Wait for the actual image error handler, then inspect the document it leaves behind.
    await image.evaluate((element: HTMLImageElement) =>
        element.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) =>
                  element.addEventListener('error', () => resolve(), {once: true}),
              ),
    );
    await expect(image).toHaveCount(1);
    await expect(image).toHaveAttribute('src', '/assets/unavailable-image.jpg');
    await page.getByRole('button', {name: 'Read value'}).click();
    await expect(page.locator('[data-testid="value"]')).toHaveText(original);
    await expect(page.locator('[data-testid="calls"]')).toHaveText('0');
});

for (const mode of ['wysiwyg', 'markup'] as const) {
    test(`Resource paste ${mode} saved before resolution reopens as an image`, async ({
        mount,
        page,
    }) => {
        const mounted = await mount(<PasteResources mode={mode} />);
        const editor = page.locator(mode === 'wysiwyg' ? '.ProseMirror' : '.cm-content');
        await editor.evaluate((element) => {
            const data = new DataTransfer();
            data.setData('text/html', '<img src="/assets/test-image.jpg" alt="pasted">');
            element.dispatchEvent(
                Object.assign(new Event('paste', {bubbles: true, cancelable: true}), {
                    clipboardData: data,
                }),
            );
        });
        await expect(editor.locator('[data-resource-pending]')).toHaveCount(1);
        await page.getByRole('button', {name: 'Read value'}).click();
        const saved = await page.locator('[data-testid="value"]').textContent();
        expect(saved).toMatch(/!\[pasted\]\((?:https?:\/\/[^/]+)?\/assets\/test-image\.jpg\)/);
        await mounted.unmount();
        await mount(<PasteResources mode="wysiwyg" initialMarkup={saved!} />);
        const image = page.locator('.ProseMirror img');
        await expect(image).toBeVisible();
        await expect(image).toHaveJSProperty(
            'src',
            new URL('/assets/test-image.jpg', page.url()).href,
        );
        await expect(page.locator('[data-resource-pending]')).toHaveCount(0);
        await expect(page.locator('[data-testid="calls"]')).toHaveText('0');
    });

    for (const format of ['text/yfm', 'text/html', 'text/plain']) {
        test(`Resource paste ${mode} ${format} resolves once and preserves focus`, async ({
            mount,
            page,
        }) => {
            await mount(<PasteResources mode={mode} />);
            const editor = page.locator(mode === 'wysiwyg' ? '.ProseMirror' : '.cm-content');
            await editor.click();
            await editor.press('ControlOrMeta+End');
            await editor.evaluate((element, format) => {
                const data = new DataTransfer();
                data.setData(
                    format,
                    format === 'text/html'
                        ? '<p>text <img src="/assets/test-image.jpg" alt="label"></p>'
                        : 'text ![label](/assets/test-image.jpg)',
                );
                element.dispatchEvent(
                    Object.assign(new Event('paste', {bubbles: true, cancelable: true}), {
                        clipboardData: data,
                    }),
                );
            }, format);
            await expect(page.locator('[data-testid="events"]')).toHaveText('pending');
            await expect(editor).toHaveAttribute('contenteditable', 'true');
            await page.getByRole('button', {name: 'Mutate editor'}).click();
            await page.getByRole('button', {name: 'Read value'}).click();
            await expect(page.locator('[data-testid="value"]')).toContainText('before');
            await expect(page.locator('[data-testid="value"]')).toContainText('typed');
            await expect(page.locator('[data-testid="value"]')).toContainText(
                '/assets/test-image.jpg',
            );
            await expect(page.locator('[data-testid="value"]')).not.toContainText('?copied');
            await expect(page.locator('[data-testid="calls"]')).toHaveText('1');
            await page.getByRole('textbox', {name: 'Other input'}).focus();
            await page
                .getByRole('button', {name: 'Resolve paste'})
                .evaluate((button: HTMLButtonElement) => button.click());
            await expect(page.locator('[data-testid="events"]')).toHaveText('pending,succeeded');
            await expect(page.getByRole('textbox', {name: 'Other input'})).toBeFocused();
            await expect(editor).toHaveAttribute('contenteditable', 'true');
            await page.getByRole('button', {name: 'Read value'}).click();
            await expect(page.locator('[data-testid="value"]')).toContainText(
                '/assets/test-image.jpg?copied',
            );
            await editor.click();
            await page.getByRole('button', {name: 'Undo', exact: true}).click();
            await page.getByRole('button', {name: 'Read value'}).click();
            await expect(page.locator('[data-testid="value"]')).not.toContainText('typed');
            await expect(page.locator('[data-testid="value"]')).toContainText('?copied');
            await page.getByRole('button', {name: 'Undo', exact: true}).click();
            await page.getByRole('button', {name: 'Read value'}).click();
            await expect(page.locator('[data-testid="value"]')).not.toContainText(
                '/assets/test-image.jpg?copied',
            );
        });
    }
    test(`Resource paste ${mode} cancellation ignores a late response`, async ({mount, page}) => {
        await mount(<PasteResources mode={mode} />);
        const editor = page.locator(mode === 'wysiwyg' ? '.ProseMirror' : '.cm-content');
        await editor.evaluate((element) => {
            const data = new DataTransfer();
            data.setData('text/yfm', '![label](/assets/test-image.jpg)');
            element.dispatchEvent(
                Object.assign(new Event('paste', {bubbles: true, cancelable: true}), {
                    clipboardData: data,
                }),
            );
        });
        await expect(page.locator('[data-testid="events"]')).toHaveText('pending');
        await page.getByRole('button', {name: 'Cancel paste'}).click();
        await page.getByRole('button', {name: 'Resolve paste'}).click();
        await expect(page.locator('[data-testid="events"]')).toHaveText('pending,cancelled');
        await page.getByRole('button', {name: 'Read value'}).click();
        await expect(page.locator('[data-testid="value"]')).not.toContainText('/copied/');
    });
}

for (const mode of ['wysiwyg', 'markup'] as const) {
    test(`Resource paste ${mode} native copy and paste`, async ({mount, page, browserName}) => {
        test.skip(
            browserName === 'webkit',
            'Linux WebKit sends an empty native clipboard in headless mode; clipboard formats are tested with explicit events.',
        );
        await mount(<PasteResources mode={mode} />);
        await page.getByRole('button', {name: 'Seed image'}).click();
        const editor = page.locator(mode === 'wysiwyg' ? '.ProseMirror' : '.cm-content');
        await editor.click();
        await editor.press('ControlOrMeta+a');
        await editor.press('ControlOrMeta+c');
        await editor.press('ArrowRight');
        await editor.press('ControlOrMeta+v');
        await expect(page.locator('[data-testid="events"]')).toHaveText('pending');
        await page.getByRole('button', {name: 'Resolve paste'}).click();
        await expect(page.locator('[data-testid="events"]')).toHaveText('pending,succeeded');
        await expect(page.locator('[data-testid="calls"]')).toHaveText('1');
    });
}

for (const mode of ['wysiwyg', 'markup'] as const) {
    test(`Resource paste ${mode} HTML attachment follows the existing conversion`, async ({
        mount,
        page,
    }) => {
        await mount(<PasteResources mode={mode} />);
        const editor = page.locator(mode === 'wysiwyg' ? '.ProseMirror' : '.cm-content');
        await editor.evaluate((element) => {
            const data = new DataTransfer();
            data.setData(
                'text/html',
                '<p>report <a class="yfm-file" href="/old.pdf" download="report.pdf">report.pdf</a></p>',
            );
            element.dispatchEvent(
                Object.assign(new Event('paste', {bubbles: true, cancelable: true}), {
                    clipboardData: data,
                }),
            );
        });
        if (mode === 'markup') {
            await expect(page.locator('[data-testid="events"]')).toBeEmpty();
            await expect(page.locator('[data-testid="calls"]')).toHaveText('0');
            await page.getByRole('button', {name: 'Read value'}).click();
            const value = page.locator('[data-testid="value"]');
            await expect(value).toContainText('[report.pdf](');
            await expect(value).toContainText('/old.pdf');
            await expect(value).not.toContainText('/copied/file');
            return;
        }
        await expect(page.locator('[data-testid="events"]')).toHaveText('pending');
        await page.getByRole('button', {name: 'Resolve paste'}).click();
        await expect(page.locator('[data-testid="events"]')).toHaveText('pending,succeeded');
        await page.getByRole('button', {name: 'Read value'}).click();
        await expect(page.locator('[data-testid="value"]')).toContainText('/copied/file');
        await expect(page.locator('[data-testid="value"]')).toContainText('report.pdf');
    });
}

for (const mode of ['wysiwyg', 'markup'] as const) {
    test(`Resource paste ${mode} blocks mode changes while resolving`, async ({mount, page}) => {
        await mount(<PasteResources mode={mode} />);
        const editor = page.locator(mode === 'wysiwyg' ? '.ProseMirror' : '.cm-content');
        await editor.evaluate((element) => {
            const data = new DataTransfer();
            data.setData('text/yfm', '![label](/assets/test-image.jpg)');
            element.dispatchEvent(
                Object.assign(new Event('paste', {bubbles: true, cancelable: true}), {
                    clipboardData: data,
                }),
            );
        });
        await expect(page.locator('[data-testid="events"]')).toHaveText('pending');
        await page.getByRole('button', {name: 'Switch mode'}).click();
        const switched = page.locator(mode === 'wysiwyg' ? '.cm-content' : '.ProseMirror');
        await expect(switched).not.toBeVisible();
        await expect(editor).toBeVisible();
        await page.getByRole('button', {name: 'Mutate editor'}).click();
        await page.getByRole('button', {name: 'Resolve paste'}).click();
        await expect(page.locator('[data-testid="events"]')).toHaveText('pending,succeeded');
        await page.getByRole('button', {name: 'Read value'}).click();
        await expect(page.locator('[data-testid="value"]')).toContainText('?copied');
        await expect(page.locator('[data-testid="value"]')).toContainText('typed');
        await expect(page.locator('[data-testid="calls"]')).toHaveText('1');
        await expect(editor).toBeVisible();
        await page.getByRole('button', {name: 'Switch mode'}).click();
        await expect(switched).toBeVisible();
    });
}

for (const existingDefinition of [false, true]) {
    test(`Resource paste Markdown isolates references with existing definition=${existingDefinition}`, async ({
        mount,
        page,
    }) => {
        await mount(<PasteResources mode="markup" />);
        const editor = page.locator('.cm-content');
        await editor.click();
        await editor.press('Control+a');
        await page.keyboard.insertText(
            existingDefinition ? '[ref]: /assets/test-image.jpg\n\n' : 'before\n\n',
        );
        await editor.press('Control+End');
        await editor.evaluate((element, existing) => {
            const data = new DataTransfer();
            data.setData(
                'text/yfm',
                existing ? '![pasted][ref]' : '![pasted][ref]\n\n[ref]: /assets/test-image.jpg',
            );
            element.dispatchEvent(
                Object.assign(new Event('paste', {bubbles: true, cancelable: true}), {
                    clipboardData: data,
                }),
            );
        }, existingDefinition);
        if (existingDefinition) {
            await expect(page.locator('[data-testid="calls"]')).toHaveText('0');
            await expect(page.locator('[data-resource-pending]')).toHaveCount(0);
            await page.getByRole('button', {name: 'Read value'}).click();
            await expect(page.locator('[data-testid="value"]')).toContainText('![pasted][ref]');
            return;
        }
        await expect(page.locator('[data-testid="calls"]')).toHaveText('1');
        await editor.press('Control+End');
        await page.keyboard.insertText('\n\n![typed][ref]');
        await page.getByRole('button', {name: 'Resolve paste'}).click();
        await expect(page.locator('[data-testid="events"]')).toHaveText('pending,succeeded');
        await page.getByRole('button', {name: 'Read value'}).click();
        const value = page.locator('[data-testid="value"]');
        await expect(value).toContainText('![pasted](/assets/test-image.jpg?copied)');
        await expect(value).toContainText('![typed](/assets/test-image.jpg?copied)');
        await expect(value).toContainText('[ref]: /assets/test-image.jpg');
        await expect(page.locator('[data-testid="calls"]')).toHaveText('1');
    });
}

for (const mode of ['wysiwyg', 'markup'] as const) {
    test(`Resource paste ${mode} shows only inserted loaders and protects selection deletion`, async ({
        mount,
        page,
        isMobile,
        browserName,
    }) => {
        await mount(<PasteResources mode={mode} />);
        await page.getByRole('button', {name: 'Seed image'}).click();
        const editor = page.locator(mode === 'wysiwyg' ? '.ProseMirror' : '.cm-content');
        await editor.click();
        await editor.press('ControlOrMeta+End');
        await editor.evaluate((element) => {
            const data = new DataTransfer();
            data.setData(
                'text/yfm',
                '\n\n![B](/assets/test-image.jpg =100x80) {% file src="/report.pdf" name="report.pdf" %}',
            );
            element.dispatchEvent(
                Object.assign(new Event('paste', {bubbles: true, cancelable: true}), {
                    clipboardData: data,
                }),
            );
        });
        await expect(editor.locator('[data-resource-pending]')).toHaveCount(2);
        await expect(editor.locator('[data-resource-pending="image"]')).toBeVisible();
        await expect(editor.locator('[data-resource-pending="file"]')).toContainText('report.pdf');
        if (mode === 'wysiwyg') {
            await expect(editor.locator('img:visible')).toHaveCount(1);
            const skeleton = editor.locator('[data-resource-pending="image"] .g-skeleton');
            await expect(skeleton).toBeVisible();
            const box = await skeleton.boundingBox();
            expect(box?.width).toBeCloseTo(100, 0);
            expect(box?.height).toBeCloseTo(80, 0);
        } else {
            await expect(editor.locator('[data-resource-pending="image"]')).toContainText('B');
        }
        await expect(page.getByRole('button', {name: 'Undo', exact: true})).toBeDisabled();
        await page.locator('[data-qa="g-md-settings-button"]').click();
        await expect(page.locator('[data-qa="g-md-settings-mode-wysiwyg"]')).toHaveClass(
            /g-menu__item_disabled/,
        );
        await expect(page.locator('[data-qa="g-md-settings-mode-markup"]')).toHaveClass(
            /g-menu__item_disabled/,
        );
        await page.keyboard.press('Escape');
        await page.getByRole('button', {name: 'Read value'}).click();
        const before = await page.locator('[data-testid="value"]').textContent();
        await editor.click();
        await editor.press(
            isMobile && browserName === 'webkit' && mode === 'markup'
                ? 'Meta+a'
                : 'ControlOrMeta+a',
        );
        await editor.press('Backspace');
        if (isMobile && browserName === 'webkit' && mode === 'markup') {
            // CodeMirror defers iOS deletion keys by 250 ms. Let that edit attempt
            // finish while the resource is still protected, before resolving it.
            await page.waitForTimeout(300);
        }
        await page.getByRole('button', {name: 'Read value'}).click();
        expect(await page.locator('[data-testid="value"]').textContent()).toBe(before);
        await page.getByRole('button', {name: 'Resolve paste'}).click();
        await expect(editor.locator('[data-resource-pending]')).toHaveCount(0);
        await page.getByRole('button', {name: 'Read value'}).click();
        await expect(page.locator('[data-testid="value"]')).toContainText('?copied');
        await page.getByRole('button', {name: 'Undo', exact: true}).click();
        await page.getByRole('button', {name: 'Read value'}).click();
        await expect(page.locator('[data-testid="value"]')).toContainText('?copied');
        await expect(page.locator('[data-testid="value"]')).not.toContainText('report.pdf');
        await page.getByRole('button', {name: 'Redo', exact: true}).click();
        await page.getByRole('button', {name: 'Read value'}).click();
        await expect(page.locator('[data-testid="value"]')).toContainText('report.pdf');
        await expect(page.locator('[data-testid="calls"]')).toHaveText('1');
    });
}
