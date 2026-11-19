import {Logger2} from '@gravity-ui/markdown-editor';
import * as loggerUtils from '@gravity-ui/markdown-editor/_/core/utils/logger.js';
import {type ExtensionAuto, ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererExtension} from '@gravity-ui/markdown-editor/extensions';
import {history} from '@gravity-ui/markdown-editor/pm/history';
import {Slice} from '@gravity-ui/markdown-editor/pm/model';
import {
    EditorState,
    NodeSelection,
    type Plugin,
    TextSelection,
} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {BaseSchemaSpecs} from '@gravity-ui/markdown-editor/specs';
import {afterEach, vi} from 'vitest';

import {Header, type HeaderOptions} from '../src/wysiwyg/extensions/Header';

const {LoggerFacet} = loggerUtils as unknown as {
    LoggerFacet: {of(logger: Logger2.ILogger): Plugin};
};

export const header = (...blocks: string[]) =>
    [':::header{height="s" width="m"}', ...blocks, ':::'].join('\n\n');

export const headerExtensions =
    (
        extra?: ExtensionAuto,
        storage = new ReactRenderStorage(),
        options: HeaderOptions = {},
    ): ExtensionAuto =>
    (builder) => {
        builder.use(BaseSchemaSpecs, {}).use(ReactRendererExtension, storage);
        if (extra) builder.use(extra);
        builder.use(Header, options);
    };

export const setCursor = (editor: EditorView, from: number, to = from) =>
    editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, from, to)));

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

/** The position of the last node of the type, or -1. */
export const nodePos = (editor: EditorView, name: string) => {
    const found = nodePositions(editor, name);
    return found.length ? found[found.length - 1] : -1;
};

/** The position of the start, or of the `end`, of the last text node with this text, or -1. */
export const textPos = (editor: EditorView, text: string, end = false) => {
    let found = -1;
    editor.state.doc.descendants((node, pos) => {
        if (node.isText && node.text === text) found = pos + (end ? node.nodeSize : 0);
    });
    return found;
};

const transferData = (data: Record<string, string>) => ({
    types: Object.keys(data),
    files: [],
    getData: (type: string) => data[type] ?? '',
});

/** Pastes the clipboard data by its types, such as `text/plain`; returns whether the event was handled. */
export function paste(editor: EditorView, data: Record<string, string>) {
    const event = new Event('paste', {bubbles: true, cancelable: true});
    Object.assign(event, {clipboardData: transferData(data)});
    editor.dom.dispatchEvent(event);
    return event.defaultPrevented;
}

export const pasteText = (editor: EditorView, text: string) => paste(editor, {'text/plain': text});

/** Drops a slice, a selected node or clipboard data at `pos`; a slice is dragged from the editor. */
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
    Object.assign(event, {
        dataTransfer: transferData(data),
        clientX: 0,
        clientY: 0,
        altKey: !move,
        ctrlKey: !move,
    });
    editor.dom.dispatchEvent(event);
}
