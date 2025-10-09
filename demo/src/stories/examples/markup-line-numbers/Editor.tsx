import {memo, useState} from 'react';

import {
    MarkdownEditorView,
    NumberInput,
    setHighlightedLine,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import type {MarkupLineNumbersConfig} from '@gravity-ui/markdown-editor';
import {Button, Flex} from '@gravity-ui/uikit';

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
    'You can also programmatically highlight a line using the',
    '`setHighlightedLine` StateEffect exported from the package.',
    '',
    '### Scroll to Line',
    '',
    'The `markupConfig.lineNumbers.scrollToLine` option allows you to scroll the',
    'editor to a specific line (0-based) on mount. This is useful',
    'when you want to draw attention to a particular section of',
    'a long document.',
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
    "import {lineHighlight, useMarkdownEditor} from '@gravity-ui/markdown-editor';",
    '',
    'const editor = useMarkdownEditor({',
    "    initial: {mode: 'markup'},",
    '    markupConfig: {',
    '        extensions: [lineHighlight()],',
    '    },',
    '});',
    '```',
    '',
    '### Table',
    '',
    '| Feature | Option | Default |',
    '|---------|--------|---------|',
    '| Line numbers | `markupConfig.lineNumbers` | `false` |',
    '| Highlight line | `markupConfig.extensions: [lineHighlight()]` | — |',
    '| Scroll to line | `markupConfig.lineNumbers.scrollToLine` | `undefined` |',
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
    'This is the end of the demo document. If `scrollToLine` is set',
    'to a value like 20, the editor should scroll to approximately',
    'this area of the document on initialization.',
    '',
    '> **Tip:** Try clicking on line numbers in the gutter to highlight lines!',
].join('\n');

export type MarkupLineNumbersEditorProps = {
    lineNumbers?: MarkupLineNumbersConfig;
};

export const MarkupLineNumbersEditor = memo<MarkupLineNumbersEditorProps>(
    function MarkupLineNumbersEditor({lineNumbers}) {
        const [fromLine, setFromLine] = useState<number | undefined>(
            lineNumbers?.initialSelectedLines?.from ?? 0,
        );
        const [toLine, setToLine] = useState<number | undefined>(
            lineNumbers?.initialSelectedLines?.to ?? 0,
        );
        const [lastClickedLine, setLastClickedLine] = useState<number | null>(null);

        const markupLineNumbers: MarkupLineNumbersConfig | undefined = lineNumbers
            ? {
                  ...lineNumbers,
                  onLineClick: (line) => setLastClickedLine(line),
              }
            : undefined;

        const editor = useMarkdownEditor(
            {
                initial: {
                    mode: 'markup',
                    markup: longMarkup,
                },
                markupConfig: {
                    lineNumbers: markupLineNumbers,
                },
            },
            [],
        );

        const handleHighlightLine = () => {
            if (typeof fromLine !== 'number' || Number.isNaN(fromLine)) return;
            if (typeof toLine !== 'number' || Number.isNaN(toLine)) return;

            const cm = (editor as any).cm;
            if (cm) {
                cm.dispatch({effects: setHighlightedLine.of({from: fromLine, to: toLine})});
            }
        };

        return (
            <PlaygroundLayout
                title="Markup Line Numbers"
                editor={editor}
                actions={({className}) =>
                    lineNumbers?.highlightLines ? (
                        <Flex gap="2" className={className} alignItems="center">
                            <span>From line:</span>
                            <NumberInput
                                size="s"
                                value={fromLine}
                                onUpdate={setFromLine}
                                min={0}
                                style={{width: '72px'}}
                            />
                            <span>To line:</span>
                            <NumberInput
                                size="s"
                                value={toLine}
                                onUpdate={setToLine}
                                min={0}
                                style={{width: '72px'}}
                            />
                            <Button size="s" onClick={handleHighlightLine}>
                                Highlight
                            </Button>
                            <Button
                                size="s"
                                view="outlined"
                                onClick={() => {
                                    const cm = (editor as any).cm;
                                    if (cm) {
                                        cm.dispatch({effects: setHighlightedLine.of(null)});
                                    }
                                }}
                            >
                                Clear
                            </Button>
                            {lastClickedLine !== null && (
                                <span>Last clicked: line {lastClickedLine + 1}</span>
                            )}
                        </Flex>
                    ) : null
                }
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
