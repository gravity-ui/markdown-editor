import {Breaks, Clipboard} from '@gravity-ui/markdown-editor/extensions';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {CodeBlockSpecs} from '@gravity-ui/markdown-editor/specs';

import {createTestEditor, drop, headerExtensions, textPos} from './editor';

export const title = '::header-title[Team portal]';

const codeText = 'line1\n\nline2';

export const codeBlock = `\`\`\`\n${codeText}\n\`\`\``;

export const multiLineInputs: [string, (editor: EditorView, pos: number) => void][] = [
    ['inserted', (editor, pos) => editor.dispatch(editor.state.tr.insertText(codeText, pos))],
    [
        'dropped from a code block',
        (editor, pos) => {
            const from = textPos(editor, codeText);
            drop(editor, editor.state.doc.slice(from, from + codeText.length), pos);
        },
    ],
];

export const multiLineEditors = () =>
    [
        [
            'with line breaks',
            createTestEditor(
                headerExtensions((builder) =>
                    builder.use(Breaks, {}).use(CodeBlockSpecs, {}).use(Clipboard, {}),
                ),
            ),
        ],
        [
            'without line breaks',
            createTestEditor(
                headerExtensions((builder) => builder.use(CodeBlockSpecs, {}).use(Clipboard, {})),
            ),
        ],
    ] as const;
