import {memo} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from 'src/index';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

import {markup} from './markup';

export type YfmTableDnDDemoProps = {
    mobile: boolean;
    dnd: boolean;
};

export const YfmTableDnDDemo = memo<YfmTableDnDDemoProps>(function YfmTableDnDDemo({mobile, dnd}) {
    const editor = useMarkdownEditor(
        {
            mobile,
            initial: {
                mode: 'wysiwyg',
                markup,
            },
            wysiwygConfig: {
                extensionOptions: {
                    yfmTable: {
                        dnd,
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
