import {test} from 'playwright/core';

import {MarkdownEditorViewTest} from './helpersPlaywright';

test.describe('MarkdownEditorView', () => {
    test('default', async ({mount, expectScreenshot}) => {
        await mount(<MarkdownEditorViewTest />);
        await expectScreenshot();
    });
});
