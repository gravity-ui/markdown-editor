import {memo} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';

import {MoveToLine} from '../../../components/MoveToLine';
import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {markup} from '../../../defaults/content';

import {lineNumbersPlugin} from './md-plugin';

export type EditorWithLineNumbersProps = {};

export const EditorWithLineNumbers = memo<EditorWithLineNumbersProps>(
    function EditorWithLineNumbers() {
        const editor = useMarkdownEditor(
            {
                initial: {
                    mode: 'wysiwyg',
                    markup,
                },
                wysiwygConfig: {
                    extensions: (builder) =>
                        builder.configureMd((md) => md.use(lineNumbersPlugin), {text: false}),
                },
            },
            [],
        );

        return (
            <PlaygroundLayout
                title="Line numbers example"
                editor={editor}
                actions={({className}) => (
                    <MoveToLine
                        className={className}
                        onClick={(line) => {
                            if (typeof line !== 'number' || Number.isNaN(line)) return;
                            editor.moveCursor({line});
                            editor.focus();
                        }}
                    />
                )}
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
    },
);
