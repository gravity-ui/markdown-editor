import {memo} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

import {markup} from './markup';

export type DateDemoProps = {
    mode: 'wysiwyg' | 'markup';
};

export const DateDemo = memo<DateDemoProps>(function DateDemo({mode}) {
    const editor = useMarkdownEditor({initial: {mode, markup}}, [mode]);

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
