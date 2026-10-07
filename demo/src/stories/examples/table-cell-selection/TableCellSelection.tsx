import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {ThemeProvider} from '@gravity-ui/uikit';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

import {markup} from './markup';

export function TableCellSelectionDemo({
    theme = 'light',
    controls = true,
    initialMarkup = markup,
}: {
    theme?: 'light' | 'dark';
    controls?: boolean;
    initialMarkup?: string;
}) {
    const editor = useMarkdownEditor(
        {
            initial: {mode: 'wysiwyg', markup: initialMarkup},
            wysiwygConfig: {
                extensionOptions: {
                    tableCellSelection: true,
                    yfmTable: {controls, cellBackground: true},
                    yfmConfigs: {mods: {'no-stripe-table': true}},
                },
            },
        },
        [controls, initialMarkup],
    );

    return (
        <ThemeProvider theme={theme}>
            <PlaygroundLayout
                title="Table cell selection"
                editor={editor}
                view={({className}) => (
                    <MarkdownEditorView
                        editor={editor}
                        className={className}
                        autofocus
                        stickyToolbar={false}
                        settingsVisible
                    />
                )}
            />
        </ThemeProvider>
    );
}
