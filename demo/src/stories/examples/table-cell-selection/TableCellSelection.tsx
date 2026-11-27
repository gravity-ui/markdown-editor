import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {full} from '@gravity-ui/markdown-editor/toolbars';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

import {markup} from './markup';

export function TableCellSelectionDemo({
    controls = true,
    enabled = true,
    initialMarkup = markup,
    viewWidth = 960,
}: {
    controls?: boolean;
    enabled?: boolean;
    initialMarkup?: string;
    viewWidth?: number;
}) {
    const editor = useMarkdownEditor(
        {
            initial: {mode: 'wysiwyg', markup: initialMarkup},
            wysiwygConfig: {
                tableCellSelection: enabled,
                extensionOptions: {
                    yfmTable: {controls, cellBackground: true},
                    yfmConfigs: {mods: {'no-stripe-table': true}},
                },
            },
        },
        [controls, enabled, initialMarkup],
    );

    return (
        <PlaygroundLayout
            title="Table cell selection"
            editor={editor}
            viewWidth={viewWidth}
            view={({className}) => (
                <MarkdownEditorView
                    editor={editor}
                    qa="demo-md-editor"
                    className={className}
                    autofocus
                    stickyToolbar={false}
                    toolbarsPreset={full}
                    settingsVisible
                />
            )}
        />
    );
}
