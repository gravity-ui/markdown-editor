import {useCallback} from 'react';

import {
    type MarkdownEditorMode,
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ActionName as Action, ToolbarName, full} from '@gravity-ui/markdown-editor/toolbars';
import {Label, toolbarLabelItem} from '@gravity-ui/markdown-editor-label-extension';

import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';
import {useEditorHandle} from '../../hooks/useEditorHandle';

const markup = `
## Label

Release checklist: :label[In progress]{color=blue} is a text directive inside the line.

Every color of the palette:

- :label[Gray]
- :label[Green]{color=green}
- :label[Yellow]{color=yellow}
- :label[Blue]{color=blue}
- :label[Red]{color=red}
- :label[Purple]{color=purple}

The former directive and colors are read as labels: :status[Teal]{color=teal} :status[Orange]{color=orange}

> Inside a quote: :label[On review]{color=yellow}

{% cut "Inside a cut" %}

:label[Done]{color=green}

{% endcut %}
`.trim();

const mainToolbar = [
    [Action.undo, Action.redo],
    [Action.bold, Action.italic, Action.underline, Action.strike, Action.mono, Action.mark],
    [Action.link],
    ['label'],
];

const toolbars = {
    items: {
        ...full.items,
        label: toolbarLabelItem,
    },
    orders: {
        ...full.orders,
        [ToolbarName.wysiwygMain]: mainToolbar,
        [ToolbarName.markupMain]: mainToolbar,
        [ToolbarName.wysiwygHidden]: [],
        [ToolbarName.markupHidden]: [],
        [ToolbarName.wysiwygSlash]: [[...full.orders[ToolbarName.wysiwygSlash].flat(), 'label']],
    },
};

export function LabelExample({
    initial = markup,
    mode = 'wysiwyg',
    width = 1000,
}: {
    initial?: string;
    mode?: MarkdownEditorMode;
    width?: number;
}) {
    const renderPreview = useCallback<RenderPreview>(
        ({getValue}) => <SplitModePreviewLazy getValue={getValue} needToSanitizeHtml />,
        [],
    );
    const editor = useMarkdownEditor({
        initial: {markup: initial, mode, toolbarVisible: true},
        wysiwygConfig: {extensions: (builder) => builder.use(Label)},
        markupConfig: {renderPreview},
    });
    useEditorHandle(editor);
    return (
        <div style={{width, maxWidth: '100%'}}>
            <MarkdownEditorView editor={editor} toolbarsPreset={toolbars} stickyToolbar={false} />
        </div>
    );
}
