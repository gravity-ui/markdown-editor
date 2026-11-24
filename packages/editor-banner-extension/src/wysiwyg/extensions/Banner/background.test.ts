// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {history, redo, undo} from '@gravity-ui/markdown-editor/pm/history';
import {DOMParser, DOMSerializer} from '@gravity-ui/markdown-editor/pm/model';
import {type Command, EditorState} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {BaseSchemaSpecs} from '@gravity-ui/markdown-editor/specs';
import {type BannerBackground, bannerBackground} from '@gravity-ui/markdown-plugin-banner';
import {afterEach, describe, expect, it} from 'vitest';

import {bannerUploadPlugin, uploadBannerFile} from '../../plugins/BannerUploadPlugin';

import {BannerSpecs} from './BannerSpecs';
import {setBannerBackground} from './commands';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(BannerSpecs),
}).buildDeps();

let view: EditorView | undefined;
afterEach(() => {
    view?.destroy();
    view = undefined;
});

function createView(markup = ':::banner\n:::') {
    view = new EditorView(document.createElement('div'), {
        state: EditorState.create({
            schema,
            doc: markupParser.parse(markup),
            plugins: [history(), bannerUploadPlugin()],
        }),
    });
    return view;
}

function run(editor: EditorView, command: Command) {
    return command(editor.state, editor.dispatch, editor);
}

const backgroundAt = (editor: EditorView, pos = 0) =>
    bannerBackground(editor.state.doc.nodeAt(pos)?.attrs ?? {});

function deferred() {
    let resolve!: (url: string) => void;
    const promise = new Promise<{url: string}>((done) => {
        resolve = (url) => done({url});
    });
    return {handler: () => promise, resolve};
}

const upload = (editor: EditorView, pos: number, handler: () => Promise<{url: string}>) =>
    uploadBannerFile(editor, pos, new File([], 'a.png'), handler, (current, image) =>
        setBannerBackground(current, {'bg-image': image}),
    );

describe('Banner background editing', () => {
    it.each([
        ['a fill', ' bg-color="blue-light"'],
        [
            'an image with a theme and blur',
            ' bg-image="/a.png" bg-theme="dark" bg-image-blur="true"',
        ],
        ['a fill under an image', ' bg-color="red-heavy" bg-image="/a b(1).png" bg-theme="light"'],
    ])('should round trip %s through Markdown and HTML', (_name, attrs) => {
        const source = `:::banner{height="s" width="m"${attrs}}\n\n:::`;
        const doc = markupParser.parse(source);
        expect(serializer.serialize(doc)).toBe(source);
        const container = document.createElement('div');
        container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        expect(DOMParser.fromSchema(schema).parse(container).toJSON()).toEqual(doc.toJSON());
    });

    it('should undo and redo each background change in one step', () => {
        const editor = createView();
        const changes: Partial<BannerBackground>[] = [
            {'bg-color': 'blue-light'},
            {'bg-image': '/a.png'},
            {'bg-theme': 'dark'},
            {'bg-image-blur': true},
        ];
        const states = [backgroundAt(editor)];
        for (const change of changes) {
            expect(run(editor, setBannerBackground(0, change))).toBe(true);
            states.push(backgroundAt(editor));
        }
        for (const expected of states.slice(0, -1).reverse()) {
            expect(run(editor, undo)).toBe(true);
            expect(backgroundAt(editor)).toEqual(expected);
        }
        for (const expected of states.slice(1)) {
            expect(run(editor, redo)).toBe(true);
            expect(backgroundAt(editor)).toEqual(expected);
        }
    });

    it('should keep a configured background when the editor switches modes', () => {
        const editor = createView(':::banner\nText\n:::');
        run(editor, setBannerBackground(0, {'bg-color': 'green-medium'}));
        run(
            editor,
            setBannerBackground(0, {
                'bg-image': '/a.png',
                'bg-theme': 'light',
                'bg-image-blur': true,
            }),
        );
        const markup = serializer.serialize(editor.state.doc);
        expect(markup).toBe(
            ':::banner{height="s" width="m" bg-color="green-medium" bg-image="/a.png" bg-theme="light" bg-image-blur="true"}\n\nText\n\n:::',
        );
        const restored = markupParser.parse(markup);
        expect(restored.toJSON()).toEqual(editor.state.doc.toJSON());
        expect(serializer.serialize(restored)).toBe(markup);
    });

    it('should write competing uploads only into their own banners', async () => {
        // 0 banner 1 p 2 /p 3 /banner 4 banner 5 p 6 /p 7 /banner 8
        const editor = createView(':::banner\n:::\n\n:::banner\n:::');
        const [older, newer, other] = [deferred(), deferred(), deferred()];
        const results = [upload(editor, 0, older.handler), upload(editor, 0, newer.handler)];
        results.push(upload(editor, 4, other.handler));
        editor.dispatch(editor.state.tr.insert(0, schema.nodes.paragraph.create()));

        newer.resolve('/newer.png');
        other.resolve('/other.png');
        older.resolve('/older.png');
        expect(await Promise.all(results)).toEqual([false, true, true]);
        expect(backgroundAt(editor, 2)['bg-image']).toBe('/newer.png');
        expect(backgroundAt(editor, 6)['bg-image']).toBe('/other.png');
    });
});
