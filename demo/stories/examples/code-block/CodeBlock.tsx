import {memo} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from 'src/index';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

import {markup} from './markup';

export type YfmTableDnDDemoProps = {
    lineWrapping: 'disabled' | 'enabled';
    lineNumbers: 'disabled' | 'enabled' | 'by-default';
};

export const CodeBlockDemo = memo<YfmTableDnDDemoProps>(function YfmTableDnDDemo({
    lineWrapping,
    lineNumbers,
}) {
    const editor = useMarkdownEditor(
        {
            initial: {
                mode: 'wysiwyg',
                markup,
            },
            wysiwygConfig: {
                extensionOptions: {
                    codeBlock: {
                        lineWrapping: {
                            enabled: lineWrapping === 'enabled',
                        },
                        lineNumbers: {
                            enabled: lineNumbers !== 'disabled',
                            showByDefault: lineNumbers === 'by-default',
                        },
                    },
                },
            },
        },
        [lineWrapping, lineNumbers],
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
