import {memo} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';

import {toolbarPreset} from './preset';

export const MobileEditor = memo(() => {
    const editor = useMarkdownEditor({
        mobile: true,
    });

    return (
        <PlaygroundLayout
            editor={editor}
            view={({className}) => (
                <MarkdownEditorView
                    stickyToolbar
                    settingsVisible={false}
                    editor={editor}
                    className={className}
                    toolbarsPreset={toolbarPreset}
                />
            )}
        />
    );
});

MobileEditor.displayName = 'MobileEditor';
