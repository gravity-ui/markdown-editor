import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {full} from '@gravity-ui/markdown-editor/toolbars';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

import {markup} from './markup';

export function TableCellSelectionDemo({
    controls = true,
    cellBackground = true,
    scrollHeight,
    enabled = true,
    initialMarkup = markup,
    viewWidth = 960,
}: {
    controls?: boolean;
    cellBackground?: boolean;
    scrollHeight?: number;
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
                    yfmTable: {controls, cellBackground},
                    yfmConfigs: {mods: {'no-stripe-table': true}},
                },
            },
        },
        [controls, cellBackground, enabled, initialMarkup],
    );

    return (
        <PlaygroundLayout
            title="Table cell selection"
            editor={editor}
            viewWidth={viewWidth}
            view={({className}) => {
                const editorView = (
                    <MarkdownEditorView
                        editor={editor}
                        qa="demo-md-editor"
                        className={className}
                        autofocus
                        stickyToolbar={false}
                        toolbarsPreset={full}
                        settingsVisible
                    />
                );
                return scrollHeight === undefined ? (
                    editorView
                ) : (
                    <div
                        data-qa="table-cell-selection-scroll"
                        style={{height: scrollHeight, overflow: 'auto'}}
                    >
                        <div>{editorView}</div>
                    </div>
                );
            }}
        />
    );
}
