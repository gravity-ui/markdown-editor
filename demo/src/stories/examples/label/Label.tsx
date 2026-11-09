import {memo} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Label} from '@gravity-ui/markdown-editor-label-extension';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {labelToolbarsPreset} from '../../../defaults/toolbars';

import {markup} from './markup';

export type LabelDemoProps = {
    mode: 'wysiwyg' | 'markup';
};

export const LabelDemo = memo<LabelDemoProps>(function LabelDemo({mode}) {
    const editor = useMarkdownEditor(
        {
            initial: {mode, markup},
            wysiwygConfig: {extensions: (builder) => builder.use(Label)},
        },
        [mode],
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
                    toolbarsPreset={labelToolbarsPreset}
                    className={className}
                />
            )}
        />
    );
});
