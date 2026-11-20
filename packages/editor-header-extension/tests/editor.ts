import {Logger2} from '@gravity-ui/markdown-editor';
import * as loggerUtils from '@gravity-ui/markdown-editor/_/core/utils/logger.js';
import {type ExtensionAuto, ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererExtension} from '@gravity-ui/markdown-editor/extensions';
import {history} from '@gravity-ui/markdown-editor/pm/history';
import {
    EditorState,
    NodeSelection,
    type Plugin,
    TextSelection,
} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {BaseSchemaSpecs} from '@gravity-ui/markdown-editor/specs';
import {afterEach} from 'vitest';

import {Header} from '../src/wysiwyg/extensions/Header';

const {LoggerFacet} = loggerUtils as unknown as {
    LoggerFacet: {of(logger: Logger2.ILogger): Plugin};
};

export const header = (...blocks: string[]) =>
    [':::header{height="s" width="m"}', ...blocks, ':::'].join('\n\n');

export const image = '::header-image{src="/a.png" alt="A"}';

export const emptyImage = '::header-image';

export const scriptUrl = ['javascript', 'alert(1)'].join(':');

export {runCommand as run} from '../src/wysiwyg/extensions/commands';

export const setCursor = (editor: EditorView, from: number, to = from) =>
    editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, from, to)));

export const selectNode = (editor: EditorView, pos: number) =>
    editor.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)));

export const press = (editor: EditorView, key: string, modifiers?: KeyboardEventInit) =>
    Boolean(
        editor.someProp('handleKeyDown', (handler) =>
            handler(editor, new KeyboardEvent('keydown', {...modifiers, key})),
        ),
    );

export const nodePos = (editor: EditorView, name: string) => {
    let found = -1;
    editor.state.doc.descendants((node, pos) => {
        if (node.type.name === name) found = pos;
    });
    return found;
};

export const textPos = (editor: EditorView, text: string) => {
    let found = -1;
    editor.state.doc.descendants((node, pos) => {
        if (node.isText && node.text === text) found = pos;
    });
    return found;
};

/** `extra` runs before `Header`, as other extensions of an editor. */
export function createTestEditor(extra?: ExtensionAuto) {
    const logger = new Logger2();
    const extensions: ExtensionAuto = (builder) => {
        builder.use(BaseSchemaSpecs, {}).use(ReactRendererExtension, new ReactRenderStorage());
        if (extra) builder.use(extra);
        builder.use(Header, {});
    };
    const deps = new ExtensionsManager({extensions, logger}).build();
    let view: EditorView | undefined;
    afterEach(() => {
        view?.destroy();
        view = undefined;
    });

    const createView = (markup: string) => {
        view = new EditorView(document.createElement('div'), {
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
