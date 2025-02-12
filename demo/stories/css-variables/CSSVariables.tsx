import {memo} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '../../../src';
import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {markup} from '../../defaults/content';

export const CustomCSSVariablesDemo = memo((styles) => {
    const editor = useMarkdownEditor({initial: {markup}});

    return (
        <PlaygroundLayout
            editor={editor}
            style={styles}
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

CustomCSSVariablesDemo.displayName = 'CustomCSSVariables';
