import {Logger2} from '@gravity-ui/markdown-editor';
import * as loggerUtils from '@gravity-ui/markdown-editor/_/core/utils/logger.js';
import {type ExtensionAuto, ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {
    Breaks,
    Clipboard,
    ReactRenderStorage,
    ReactRendererExtension,
} from '@gravity-ui/markdown-editor/extensions';
import {history} from '@gravity-ui/markdown-editor/pm/history';
import {Slice} from '@gravity-ui/markdown-editor/pm/model';
import {
    EditorState,
    NodeSelection,
    type Plugin,
    TextSelection,
} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {BaseSchemaSpecs, CodeBlockSpecs} from '@gravity-ui/markdown-editor/specs';
import {afterEach, vi} from 'vitest';

import {Header} from '../src/wysiwyg/extensions/Header';

const {LoggerFacet} = loggerUtils as unknown as {
    LoggerFacet: {of(logger: Logger2.ILogger): Plugin};
};

export const header = (...blocks: string[]) =>
    [':::header{height="s" width="m"}', ...blocks, ':::'].join('\n\n');

export const title = '::header-title[Team portal]';

export const headerExtensions =
    (extra?: ExtensionAuto, storage = new ReactRenderStorage()): ExtensionAuto =>
    (builder) => {
        builder.use(BaseSchemaSpecs, {}).use(ReactRendererExtension, storage);
        if (extra) builder.use(extra);
        builder.use(Header);
    };

export {runCommand as run} from '../src/wysiwyg/extensions/commands';

export const setCursor = (editor: EditorView, from: number, to = from) =>
    editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, from, to)));

export const press = (editor: EditorView, key: string, modifiers?: KeyboardEventInit) =>
    Boolean(
        editor.someProp('handleKeyDown', (handler) =>
            handler(editor, new KeyboardEvent('keydown', {...modifiers, key})),
        ),
    );

const nodePositions = (editor: EditorView, name: string) => {
    const found: number[] = [];
    editor.state.doc.descendants((node, pos) => {
        if (node.type.name === name) found.push(pos);
    });
    return found;
};

export const countNodes = (editor: EditorView, name: string) => nodePositions(editor, name).length;

export const nodePos = (editor: EditorView, name: string) => {
    const found = nodePositions(editor, name);
    return found.length ? found[found.length - 1] : -1;
};

export const textPos = (editor: EditorView, text: string, end = false) => {
    let found = -1;
    editor.state.doc.descendants((node, pos) => {
        if (node.isText && node.text === text) found = pos + (end ? node.nodeSize : 0);
    });
    return found;
};

function pasteData(editor: EditorView, data: Record<string, string>) {
    const event = new Event('paste', {bubbles: true, cancelable: true});
    const clipboardData = {
        types: Object.keys(data),
        files: [],
        getData: (type: string) => data[type] ?? '',
    };
    Object.assign(event, {clipboardData});
    editor.dom.dispatchEvent(event);
}

export const pasteText = (editor: EditorView, text: string) =>
    pasteData(editor, {'text/plain': text});

export function drop(
    editor: EditorView,
    dropped: Slice | NodeSelection | Record<string, string>,
    pos: number,
    move = false,
) {
    const node = dropped instanceof NodeSelection ? dropped : undefined;
    const slice = dropped instanceof NodeSelection ? dropped.content() : dropped;
    const data = slice instanceof Slice ? {} : slice;
    if (slice instanceof Slice) Object.assign(editor, {dragging: {slice, move, node}});
    vi.spyOn(editor, 'posAtCoords').mockReturnValue({pos, inside: -1});
    const event = new Event('drop', {bubbles: true, cancelable: true});
    const dataTransfer = {
        types: Object.keys(data),
        files: [],
        getData: (type: string) => data[type] ?? '',
    };
    Object.assign(event, {dataTransfer, clientX: 0, clientY: 0, altKey: !move, ctrlKey: !move});
    editor.dom.dispatchEvent(event);
}

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

export function createTestEditor(extensions: ExtensionAuto = headerExtensions()) {
    const logger = new Logger2();
    const deps = new ExtensionsManager({extensions, logger}).build();
    let view: EditorView | undefined;
    afterEach(() => {
        view?.destroy();
        view = undefined;
    });

    const createView = (markup: string, place: HTMLElement = document.createElement('div')) => {
        view = new EditorView(place, {
            state: EditorState.create({
                schema: deps.schema,
                doc: deps.markupParser.parse(markup),
                plugins: [LoggerFacet.of(logger), history(), ...deps.plugins],
            }),
            nodeViews: deps.nodeViews,
        });
        return view;
    };
    const markup = (editor: EditorView) => deps.serializer.serialize(editor.state.doc);

    return {...deps, createView, markup};
}

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
