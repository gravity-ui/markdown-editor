import {Logger2} from '@gravity-ui/markdown-editor';
import * as loggerUtils from '@gravity-ui/markdown-editor/_/core/utils/logger.js';
import {type ExtensionAuto, ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {ReactRenderStorage, ReactRendererExtension} from '@gravity-ui/markdown-editor/extensions';
import {history} from '@gravity-ui/markdown-editor/pm/history';
import {EditorState, type Plugin} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {BaseSchemaSpecs} from '@gravity-ui/markdown-editor/specs';
import {afterEach} from 'vitest';

import {Banner, type BannerOptions} from '../src/wysiwyg/extensions/Banner';
import {Button} from '../src/wysiwyg/extensions/Button';

const {LoggerFacet} = loggerUtils as unknown as {
    LoggerFacet: {of(logger: Logger2.ILogger): Plugin};
};

export const banner = (...blocks: string[]) =>
    [':::banner{height="s" width="m"}', ...blocks, ':::'].join('\n\n');

export const bannerContentMarkup = (paragraphs: readonly string[]) =>
    `:::banner-content\n\n${paragraphs.map((text) => `${text}\n\n`).join('')}:::`;

export const description = bannerContentMarkup(['Portal description.']);

export const button = ':button[Open]{href="/page" view="action" color="standard"}';

export const title = '::banner-title[Team portal]';

export const image = '::banner-image{src="/a.png" alt="A"}';

export const scriptUrl = ['javascript', 'alert(1)'].join(':');

export const bannerExtensions =
    (
        extra?: ExtensionAuto,
        storage = new ReactRenderStorage(),
        options: BannerOptions = {},
    ): ExtensionAuto =>
    (builder) => {
        builder.use(BaseSchemaSpecs, {}).use(ReactRendererExtension, storage);
        if (extra) builder.use(extra);
        builder.use(Banner, options).use(Button);
    };

export {runCommand as run} from '../src/wysiwyg/extensions/commands';

export const press = (editor: EditorView, key: string, modifiers?: KeyboardEventInit) =>
    Boolean(
        editor.someProp('handleKeyDown', (handler) =>
            handler(editor, new KeyboardEvent('keydown', {...modifiers, key})),
        ),
    );

export function copy(editor: EditorView) {
    const data = new Map<string, string>();
    const clipboardData = {
        types: [] as string[],
        files: [],
        clearData: () => data.clear(),
        setData: (type: string, value: string) => data.set(type, value),
        getData: (type: string) => data.get(type) ?? '',
    };
    const event = {clipboardData, preventDefault() {}} as unknown as ClipboardEvent;
    editor.someProp('handleDOMEvents', (handlers) => handlers.copy?.(editor, event));
    clipboardData.types = [...data.keys()];
    return {event, html: data.get('text/html') ?? '', yfm: data.get('text/yfm') ?? ''};
}

export type Copied = ReturnType<typeof copy>;

export const paste = (editor: EditorView, {event}: Copied) =>
    editor.someProp('handleDOMEvents', (handlers) => handlers.paste?.(editor, event));

export const codeText = 'line1\n\nline2';

export const codeBlock = `\`\`\`\n${codeText}\n\`\`\``;

export function createTestEditor(extensions: ExtensionAuto = bannerExtensions()) {
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
