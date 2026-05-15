import {memo} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

import {markup} from './markup';

export type YfmTableDnDDemoProps = {
    mobile: boolean;
    dnd: boolean;
    headerRows: boolean;
    cellBackground: boolean;
};

export const YfmTableDnDDemo = memo<YfmTableDnDDemoProps>(function YfmTableDnDDemo({
    mobile,
    dnd,
    headerRows,
    cellBackground,
}) {
    const editor = useMarkdownEditor(
        {
            mobile,
            initial: {
                mode: 'wysiwyg',
                markup,
            },
            wysiwygConfig: {
                extensionOptions: {
                    yfmConfigs: {
                        mods: {'no-stripe-table': true},
                    },
                    yfmTable: {
                        dnd,
                        headerRows,
                        cellBackground,
                    },
                },
            },
        },
        [mobile, dnd],
    );

    return (
        <PlaygroundLayout
            editor={editor}
            view={({className}) => (
                <MarkdownEditorView
                    autofocus
                    stickyToolbar
                    settingsVisible
                    editor={editor}
                    className={className}
                />
            )}
        />
    );
});
