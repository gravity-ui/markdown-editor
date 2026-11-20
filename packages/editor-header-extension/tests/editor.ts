import {Logger2} from '@gravity-ui/markdown-editor';
import * as loggerUtils from '@gravity-ui/markdown-editor/_/core/utils/logger.js';
import {type ExtensionAuto, ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererExtension} from '@gravity-ui/markdown-editor/extensions';
import {history} from '@gravity-ui/markdown-editor/pm/history';
import {EditorState, type Plugin, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {BaseSchemaSpecs} from '@gravity-ui/markdown-editor/specs';
import {afterEach} from 'vitest';

import {Header} from '../src/wysiwyg/extensions/Header';

const {LoggerFacet} = loggerUtils as unknown as {
    LoggerFacet: {of(logger: Logger2.ILogger): Plugin};
};

export const header = (...blocks: string[]) =>
    [':::header{height="s" width="m"}', ...blocks, ':::'].join('\n\n');

export const headerExtensions =
    (extra?: ExtensionAuto, storage = new ReactRenderStorage()): ExtensionAuto =>
    (builder) => {
        builder.use(BaseSchemaSpecs, {}).use(ReactRendererExtension, storage);
        if (extra) builder.use(extra);
        builder.use(Header);
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
