import {memo} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import type {MarkupLineNumbersConfig} from '@gravity-ui/markdown-editor';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

const longMarkup = [
    '# Markup Line Numbers Demo',
    '',
    'This document demonstrates the new markup-mode features:',
    'line numbers, line highlighting, and scroll-to-line.',
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
    '### Line Highlighting',
    '',
    'When `lineHighlight()` extension is passed via `markupConfig.extensions`,',
    'clicking on a line number in the gutter will highlight that entire line.',
    'This extension automatically includes line numbers as well.',
    '',
    '```typescript',
    'const editor = useMarkdownEditor({',
    "    initial: {mode: 'markup'},",
    '    markupConfig: {',
    '        lineNumbers: {',
    '            enabled: true,',
    '            initialSelection: {lineFrom: 5, lineTo: 10},',
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
    '| Initial selection | `markupConfig.lineNumbers.initialSelection` | `undefined` |',
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
    'This is the end of the demo document. If `initialSelection.lineFrom` is set',
    'to a value like 20, the editor should scroll to approximately',
    'this area of the document on initialization.',
    '',
    '> **Tip:** Click anywhere in the editor to clear the initial selection.',
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
