import {MarkdownEditorView, gptExtension, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Button} from '@gravity-ui/uikit';

const defaultMarkup =
    '{% note info "Note" %}\n\n#|\n|| Description |\n\n```js\nSelect this text inside the code block\n```\n\n||\n|| | Another table cell ||\n|#\n\n{% endnote %}';

export function EditorTooltips({
    markup = defaultMarkup,
    gpt = false,
}: {
    markup?: string;
    gpt?: boolean;
}) {
    const editor = useMarkdownEditor({
        initial: {markup, mode: 'wysiwyg', toolbarVisible: false},
        wysiwygConfig: {
            extensions: (builder) => {
                if (gpt) {
                    builder.use(gptExtension, {
                        answerRender: ({rawText}: {rawText: string}) => <div>{rawText}</div>,
                        customPromptPlaceholder: 'Edit selected text',
                        disabledPromptPlaceholder: 'Generate text',
                        onCustomPromptApply: async () => ({rawText: 'Updated text'}),
                    });
                }
            },
        },
    });

    return (
        <div style={{marginTop: 120, width: 850}}>
            <div style={{overflow: 'clip'}}>
                <MarkdownEditorView editor={editor} settingsVisible={false} stickyToolbar={false} />
            </div>
            <Button>After editor</Button>
        </div>
    );
}
