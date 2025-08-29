import {memo} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from 'src/index';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

import {markup} from './markup';

export type YfmTableDnDDemoProps = {
    mobile: boolean;
};

export const YfmTableDnDDemo = memo<YfmTableDnDDemoProps>(function YfmTableDnDDemo({mobile}) {
    const editor = useMarkdownEditor(
        {
            mobile,
            initial: {
                mode: 'wysiwyg',
                markup,
            },
        },
        [mobile],
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
