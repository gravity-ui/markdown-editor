import {memo} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import type {MarkupLineNumbersConfig} from '@gravity-ui/markdown-editor';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

const longMarkup = [
    '# Markup Line Numbers Demo',
    '',
    'This document demonstrates line numbers in markup mode.',
    '',
    '## Getting Started',
    '',
    'The editor below is running in **markup mode** (CodeMirror 6).',
    'You can see line numbers in the gutter on the left side.',
    '',
    '### Line Numbers',
    '',
    'When `markupConfig.lineNumbers` is enabled, the editor',
    'displays line numbers in the left gutter. This is useful',
    'for referencing specific lines in documentation or code reviews.',
    '',
    '```typescript',
    'const editor = useMarkdownEditor({',
    "    initial: {mode: 'markup'},",
    '    markupConfig: {',
    '        lineNumbers: {',
    '            enabled: true,',
    '        },',
    '    },',
    '});',
    '```',
    '',
    '## Example Content',
    '',
    'Here is some additional content to make the document long',
    'enough to demonstrate scrolling behavior.',
    '',
    '### Lists',
    '',
    '- Item one',
    '- Item two',
    '- Item three',
    '- Item four',
    '- Item five',
    '',
    '### Code Block',
    '',
    '```typescript',
    "import {useMarkdownEditor} from '@gravity-ui/markdown-editor';",
    '```',
    '',
    '### Table',
    '',
    '| Feature | Option | Default |',
    '|---------|--------|---------|',
    '| Line numbers | `markupConfig.lineNumbers.enabled` | `false` |',
    '',
    '### More Text',
    '',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    '',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse',
    'cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat',
    'cupidatat non proident, sunt in culpa qui officia deserunt mollit.',
    '',
    '### Final Section',
    '',
    'This is the end of the demo document.',
].join('\n');

export type MarkupLineNumbersEditorProps = {
    lineNumbers?: MarkupLineNumbersConfig;
};

export const MarkupLineNumbersEditor = memo<MarkupLineNumbersEditorProps>(
    function MarkupLineNumbersEditor({lineNumbers}) {
        const editor = useMarkdownEditor(
            {
                initial: {
                    mode: 'markup',
                    markup: longMarkup,
                },
                markupConfig: {
                    lineNumbers,
                },
            },
            [],
        );

        return (
            <PlaygroundLayout
                title="Markup Line Numbers"
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
    },
);
