import {memo} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

import {markup} from './markup';

export type StatusDemoProps = {
    mode: 'wysiwyg' | 'markup';
};

export const StatusDemo = memo<StatusDemoProps>(function StatusDemo({mode}) {
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
