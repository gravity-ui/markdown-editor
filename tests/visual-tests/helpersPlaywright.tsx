import {MarkdownEditorView} from 'src/bundle/MarkdownEditorView';
import {useMarkdownEditor} from 'src/bundle/useMarkdownEditor';

export const MarkdownEditorViewTest = () => {
    const editor = useMarkdownEditor({});
    return <MarkdownEditorView stickyToolbar autofocus editor={editor} />;
};
