import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Button} from '@gravity-ui/uikit';

const defaultMarkup =
    '{% note info "Note" %}\n\n#|\n|| Description |\n\n```js\nSelect this text inside the code block\n```\n\n||\n|| | Another table cell ||\n|#\n\n{% endnote %}';

export function EditorTooltips({markup = defaultMarkup}: {markup?: string}) {
    const editor = useMarkdownEditor({
        initial: {markup, mode: 'wysiwyg', toolbarVisible: false},
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
