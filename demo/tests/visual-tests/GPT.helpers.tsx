import {
    MarkdownEditorView,
    gptExtension,
    mGptExtension,
    mGptToolbarItem,
    useMarkdownEditor,
    wGptItemData,
} from '@gravity-ui/markdown-editor';

import {useEditorHandle} from '../../src/hooks/useEditorHandle';
import {gptWidgetProps} from '../../src/stories/gpt/gptWidgetOptions';

const options = gptWidgetProps();

export function GptEditor() {
    const editor = useMarkdownEditor({
        initial: {markup: 'original text'},
        markupConfig: {extensions: mGptExtension(options)},
        wysiwygConfig: {extensions: (builder) => builder.use(gptExtension, options)},
    });
    useEditorHandle(editor);

    return (
        <MarkdownEditorView
            editor={editor}
            stickyToolbar={false}
            wysiwygToolbarConfig={[[wGptItemData]]}
            markupToolbarConfig={[[mGptToolbarItem]]}
        />
    );
}
