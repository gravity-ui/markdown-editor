import {
    MarkdownEditorView,
    type ToolbarsPreset,
    useMarkdownEditor,
    wBoldItemData,
    wHeading1ItemData,
    wHeading2ItemData,
    wItalicItemData,
    wStrikethroughItemData,
} from '@gravity-ui/markdown-editor';
import {
    ActionName as Action,
    ToolbarName as Toolbar,
} from '@gravity-ui/markdown-editor/_/modules/toolbars/constants.js';
import {full} from '@gravity-ui/markdown-editor/_/modules/toolbars/presets.js';

const toolbarPreset: ToolbarsPreset = {
    items: full.items,
    orders: {
        ...full.orders,
        [Toolbar.wysiwygSelection]: [[Action.italic, Action.bold]],
        [Toolbar.wysiwygSlash]: [[Action.heading1]],
    },
};

export function LegacyContextualToolbars({
    config = 'legacy',
}: {
    config?: 'legacy' | 'preset' | 'both';
}) {
    const editor = useMarkdownEditor({
        preset: 'full',
        initial: {markup: 'Select this text', mode: 'wysiwyg'},
        wysiwygConfig:
            config === 'preset'
                ? undefined
                : {
                      extensionOptions: {
                          selectionContext: {
                              config:
                                  config === 'both'
                                      ? [[wStrikethroughItemData]]
                                      : [[wItalicItemData, wBoldItemData]],
                          },
                          commandMenu: {
                              actions:
                                  config === 'both' ? [wHeading2ItemData] : [wHeading1ItemData],
                          },
                      },
                  },
    });

    return (
        <div style={{width: 800}}>
            <MarkdownEditorView
                editor={editor}
                toolbarsPreset={config === 'legacy' ? undefined : toolbarPreset}
                autofocus
                stickyToolbar={false}
            />
        </div>
    );
}
