import {expect, test} from 'playwright/core';

import {CutContentFilter} from './CutContentFilter.helpers';

const CUT_CONTENT = '.yfm-cut-content';
const PRESERVED = 'pre.g-md-preserved-markup';

test.describe('Examples, Cut content filter', () => {
    test.describe('dropped groups', () => {
        test.beforeEach(async ({mount}) => {
            await mount(<CutContentFilter />);
        });

        test('should keep paragraphs of text and links @wysiwyg', async ({editor}) => {
            await expect(editor.getByTextInContenteditable('Plain text stays')).toHaveCount(1);
            await expect(editor.getByTextInContenteditable('A soft-wrapped line')).toHaveCount(1);
            await expect(editor.getBySelectorInContenteditable(`${CUT_CONTENT} a`)).toHaveCount(1);
        });

        test('should drop blocks other than paragraphs @wysiwyg', async ({editor}) => {
            const selectors = ['img', 'h2', 'ul', 'ol', 'table', 'pre', 'blockquote', '.yfm-cut'];
            for (const selector of selectors) {
                await expect(
                    editor.getBySelectorInContenteditable(`${CUT_CONTENT} ${selector}`),
                ).toHaveCount(0);
            }
        });

        test('should drop paragraphs with other inline markup @wysiwyg', async ({editor}) => {
            await expect(editor.getByTextInContenteditable('bold')).toHaveCount(0);
            await expect(editor.getByTextInContenteditable('code')).toHaveCount(0);
        });

        test('should leave content outside the cut untouched @wysiwyg', async ({editor}) => {
            await expect(
                editor.getByTextInContenteditable('The filter ends at the cut'),
            ).toBeVisible();
            await expect(editor.getByTextInContenteditable('Untouched item')).toBeVisible();
        });

        test('should render closed cuts @wysiwyg', async ({expectScreenshot}) => {
            await expectScreenshot();
        });

        test('should render an opened cut @wysiwyg', async ({editor, expectScreenshot, wait}) => {
            const cutTitle = editor
                .getByTextInContenteditable('An image is dropped')
                .first()
                .locator('..');
            await wait.visible(cutTitle);

            await cutTitle.dispatchEvent('click', {
                bubbles: true,
                cancelable: true,
                composed: true,
            });
            await wait.timeout(300);

            await expectScreenshot();
        });

        test('should filter the preview of the markup @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');
            await editor.fill(
                '{% cut "Title" %}\n\nkept text\n\n![pic](/assets/test-image.jpg)\n\n{% endcut %}',
            );
            await editor.switchPreview('visible');

            const preview = editor.locators.previewContent;
            await wait.visible(preview);

            await expect(preview.getByText('kept text').first()).toBeAttached();
            await expect(preview.locator('img')).toHaveCount(0);
        });

        test('should render the preview of filtered cuts @markup', async ({
            editor,
            expectScreenshot,
            wait,
        }) => {
            await editor.switchMode('markup');
            await editor.switchPreview('visible');
            await wait.visible(editor.locators.previewContent);

            await expectScreenshot();
        });
    });

    test.describe('preserved groups', () => {
        test.beforeEach(async ({mount}) => {
            await mount(<CutContentFilter unmatched="preserve" />);
        });

        test('should keep the source markup of dropped blocks @wysiwyg', async ({editor}) => {
            await expect(editor.getByTextInContenteditable('![Gravity UI]')).toHaveCount(1);
            await expect(editor.getBySelectorInContenteditable(PRESERVED).first()).toBeAttached();
            await expect(editor.getBySelectorInContenteditable(`${CUT_CONTENT} img`)).toHaveCount(
                0,
            );
        });

        test('should return the source markup to the preview @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');
            await editor.fill(
                '{% cut "Title" %}\n\nkept text\n\n![pic](/assets/test-image.jpg)\n\n{% endcut %}',
            );
            await editor.switchPreview('visible');

            const preview = editor.locators.previewContent;
            await wait.visible(preview);

            await expect(preview.locator(PRESERVED)).toHaveCount(1);
            await expect(preview.locator('img')).toHaveCount(0);
        });

        test('should render an opened cut with preserved markup @wysiwyg', async ({
            editor,
            expectScreenshot,
            wait,
        }) => {
            const cutTitle = editor
                .getByTextInContenteditable('An image is dropped')
                .first()
                .locator('..');
            await wait.visible(cutTitle);

            await cutTitle.dispatchEvent('click', {
                bubbles: true,
                cancelable: true,
                composed: true,
            });
            await wait.timeout(300);

            await expectScreenshot();
        });
    });
});
