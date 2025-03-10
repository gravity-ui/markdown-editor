import {test} from '~playwright/core';
import {MarkdownEditorView} from '../MarkdownEditorView';
import {useMarkdownEditor} from '../useMarkdownEditor';

test.describe('MarkdownEditorView', () => {
    test('default', async ({mount, expectScreenshot}) => {
        const editor = useMarkdownEditor({});
        await mount(<MarkdownEditorView stickyToolbar autofocus editor={editor} />);

        await expectScreenshot();
    });
});
