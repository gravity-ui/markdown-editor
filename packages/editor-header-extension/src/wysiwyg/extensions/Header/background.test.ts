// @vitest-environment jsdom
import {undo} from '@gravity-ui/markdown-editor/pm/history';
import {DOMParser, DOMSerializer} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    type HeaderBackground,
    headerBackgroundDefaults,
    headerDefaults,
    headerLayoutDefaults,
} from '@gravity-ui/markdown-plugin-header';
import {describe, expect, it} from 'vitest';

import {createTestEditor} from '../../../../tests/editor';
import {deferred, file} from '../../../../tests/upload';
import {cancelHeaderUploads, uploadHeaderFile} from '../../plugins/HeaderUploadPlugin';
import {runCommand as run} from '../commands';

import {setHeaderBackground, setHeaderDimension} from './commands';

const {schema, markupParser, serializer, createView: create} = createTestEditor();

const createView = (markup = ':::header\n:::') => create(markup);

const uploadBackground = (
    editor: EditorView,
    pos: number,
    image: File,
    handler: ReturnType<typeof deferred>['handler'],
) =>
    uploadHeaderFile(editor, pos, image, handler, (current, src) =>
        setHeaderBackground(current, {'bg-image': src}),
    );

describe('Header background', () => {
    it('should round trip background attributes with an escaped address', () => {
        const source =
            ':::header{height="s" width="m" bg-color="blue-light" bg-image="./.files/a \\"b\\" \\\\.jpg" bg-image-theme="dark" bg-image-blur="true"}\n\n:::';
        const doc = markupParser.parse(source);
        expect(doc.firstChild?.attrs).toEqual({
            height: 's',
            width: 'm',
            ...headerLayoutDefaults,
            'bg-color': 'blue-light',
            'bg-image': './.files/a "b" \\.jpg',
            'bg-image-theme': 'dark',
            'bg-image-blur': true,
        });
        expect(serializer.serialize(doc)).toBe(source);
        const container = document.createElement('div');
        container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        expect(DOMParser.fromSchema(schema).parse(container).toJSON()).toEqual(doc.toJSON());
    });

    it.each([
        ':::header{bg-image-theme="system" bg-image-blur="false"}\n:::',
        ':::header{bg-color="blue" bg-image-theme="sepia"}\n:::',
        ':::header{bg-image-theme="dark" bg-image-blur="true"}\n:::',
        `:::header{bg-image="${['javascript', 'alert(1)'].join(':')}"}\n:::`,
        ':::header{bg-image="data:text/html,<b>"}\n:::',
    ])('should not write default or unsupported background values from %j', (markup) => {
        const doc = markupParser.parse(markup);
        expect(doc.firstChild?.attrs).toEqual({
            ...headerDefaults,
            ...headerLayoutDefaults,
            ...headerBackgroundDefaults,
        });
        expect(serializer.serialize(doc)).toBe(':::header{height="s" width="m"}\n\n:::');
    });

    it.each(['/image&copy;.png', '/image&amp;name.png', '/image&#10;.png', '/image&#65;.png'])(
        'should preserve literal entity references in the background address %s',
        (url) => {
            const editor = createView();
            run(editor, setHeaderBackground(0, {'bg-image': url}));
            const doc = editor.state.doc;
            expect(markupParser.parse(serializer.serialize(doc)).toJSON()).toEqual(doc.toJSON());
        },
    );

    it('should change background attributes in one undo step', () => {
        const editor = createView(':::header\nText\n:::');
        const background = {
            'bg-color': 'red-heavy',
            'bg-image': '/a.png',
            'bg-image-blur': true,
        } as const;
        expect(run(editor, setHeaderBackground(0, background))).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe(
            ':::header{height="s" width="m" bg-color="red-heavy" bg-image="/a.png" bg-image-blur="true"}\n\nText\n\n:::',
        );
        expect(run(editor, setHeaderBackground(0, headerBackgroundDefaults))).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe(
            ':::header{height="s" width="m"}\n\nText\n\n:::',
        );
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(editor.state.doc.firstChild?.attrs['bg-color']).toBe('red-heavy');
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(editor.state.doc.firstChild?.attrs).toEqual({
            ...headerDefaults,
            ...headerLayoutDefaults,
            ...headerBackgroundDefaults,
        });
        expect(run(editor, setHeaderBackground(2, {'bg-color': 'red-heavy'}))).toBe(false);
    });

    it('should reset the theme and the blur with the image', () => {
        const editor = createView(
            ':::header{bg-image="/a.png" bg-image-theme="dark" bg-image-blur="true"}\n:::',
        );
        expect(run(editor, setHeaderBackground(0, {'bg-image': null}))).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe(
            ':::header{height="s" width="m"}\n\n:::',
        );
    });

    it('should replace the image with a color in one undo step', () => {
        const source =
            ':::header{height="s" width="m" bg-image="/a.png" bg-image-theme="dark" bg-image-blur="true"}\n\n:::';
        const editor = createView(source);
        const color = {...headerBackgroundDefaults, 'bg-color': 'blue-light'} as const;
        expect(run(editor, setHeaderBackground(0, color))).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe(
            ':::header{height="s" width="m" bg-color="blue-light"}\n\n:::',
        );
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe(source);
    });

    it('should render background attributes in the node view and remove them', () => {
        const editor = createView(
            ':::header{bg-color="green-light" bg-image="/a.png" bg-image-theme="dark" bg-image-blur="true"}\n:::',
        );
        const dom = editor.nodeDOM(0) as HTMLElement;
        expect(Array.from(dom.classList)).toEqual(
            expect.arrayContaining([
                'g-md-header-plugin_bg-color_green-light',
                'g-md-header-plugin_bg-image',
                'g-md-header-plugin_bg-image-blur',
                'g-root',
                'g-root_theme_dark',
            ]),
        );
        expect(dom.getAttribute('data-bg-image')).toBe('/a.png');
        expect(dom.getAttribute('style')).toBe('background-image:url("/a.png")');
        expect(run(editor, setHeaderBackground(0, headerBackgroundDefaults))).toBe(true);
        expect(dom.className).toBe(
            'g-md-header-nodeview g-md-header-plugin g-md-header-plugin_height_s g-md-header-plugin_width_m',
        );
        expect(dom.hasAttribute('style')).toBe(false);
        expect(dom.getAttributeNames().filter((name) => name.startsWith('data-bg-'))).toEqual([]);
    });

    describe('background upload', () => {
        it('should write the address into the banner moved during the upload', async () => {
            const editor = createView(':::header\n:::');
            const {handler, resolve} = deferred();
            const upload = uploadBackground(editor, 0, file, handler);
            editor.dispatch(
                editor.state.tr.insert(0, editor.state.schema.nodes.paragraph.create()),
            );
            resolve({url: '/a.png'});
            await expect(upload).resolves.toBe(true);
            expect(editor.state.doc.child(1).attrs['bg-image']).toBe('/a.png');
        });

        it('should discard the address when the banner is removed', async () => {
            const editor = createView(':::header\n:::\n\nAfter');
            const {handler, resolve} = deferred();
            const upload = uploadBackground(editor, 0, file, handler);
            editor.dispatch(editor.state.tr.delete(0, editor.state.doc.child(0).nodeSize));
            const doc = editor.state.doc;
            resolve({url: '/a.png'});
            await expect(upload).resolves.toBe(false);
            expect(editor.state.doc).toBe(doc);
        });

        it('should discard the address of an older upload into the same banner', async () => {
            const editor = createView(':::header\n:::');
            const first = deferred();
            const second = deferred();
            const firstUpload = uploadBackground(editor, 0, file, first.handler);
            const secondUpload = uploadBackground(editor, 0, file, second.handler);
            first.resolve({url: '/first.png'});
            await expect(firstUpload).resolves.toBe(false);
            expect(editor.state.doc.child(0).attrs['bg-image']).toBeNull();
            second.resolve({url: '/second.png'});
            await expect(secondUpload).resolves.toBe(true);
            expect(editor.state.doc.child(0).attrs['bg-image']).toBe('/second.png');
        });

        it.each<{initial: string | null; background: Partial<HeaderBackground>}>([
            {initial: null, background: {'bg-color': 'blue-light'}},
            {initial: null, background: {'bg-image': '/new-link.png'}},
            {initial: null, background: headerBackgroundDefaults},
            {initial: '/old.png', background: headerBackgroundDefaults},
            {initial: '/old.png', background: {'bg-image': '/old.png'}},
        ])(
            'should discard a pending upload after a source choice %j',
            async ({initial, background}) => {
                const editor = createView(':::header\nText\n:::');
                run(editor, setHeaderBackground(0, {'bg-image': initial}));
                const {handler, resolve} = deferred();
                const upload = uploadBackground(editor, 0, file, handler);
                run(editor, setHeaderBackground(0, background));
                const doc = editor.state.doc;
                resolve({url: '/slow-upload.png'});
                await expect(upload).resolves.toBe(false);
                expect(editor.state.doc).toBe(doc);
            },
        );

        it('should preserve an upload through content, size, theme and blur changes', async () => {
            const editor = createView(':::header{bg-image="/old.png"}\nText\n:::');
            const {handler, resolve} = deferred();
            const upload = uploadBackground(editor, 0, file, handler);
            editor.dispatch(editor.state.tr.insertText('New ', 2));
            run(editor, setHeaderDimension(0, 'height', 'l'));
            run(editor, setHeaderBackground(0, {'bg-image-theme': 'dark', 'bg-image-blur': true}));
            resolve({url: '/new.png'});
            await expect(upload).resolves.toBe(true);
            expect(editor.state.doc.firstChild?.attrs).toMatchObject({
                height: 'l',
                'bg-image': '/new.png',
                'bg-image-theme': 'dark',
                'bg-image-blur': true,
            });
            expect(editor.state.doc.firstChild?.textContent).toBe('New Text');
        });

        it('should cancel only the upload into the reset banner', async () => {
            const editor = createView(':::header\n:::\n\n:::header\n:::');
            const secondPos = editor.state.doc.child(0).nodeSize;
            const first = deferred();
            const second = deferred();
            const firstUpload = uploadBackground(editor, 0, file, first.handler);
            const secondUpload = uploadBackground(editor, secondPos, file, second.handler);
            run(editor, setHeaderBackground(0, headerBackgroundDefaults));
            first.resolve({url: '/first.png'});
            second.resolve({url: '/second.png'});
            await expect(firstUpload).resolves.toBe(false);
            await expect(secondUpload).resolves.toBe(true);
            expect(editor.state.doc.child(0).attrs['bg-image']).toBeNull();
            expect(editor.state.doc.child(1).attrs['bg-image']).toBe('/second.png');
        });

        it('should finish a cancelled upload before its handler resolves', async () => {
            const editor = createView(':::header\n:::');
            const {handler, resolve} = deferred();
            const upload = uploadBackground(editor, 0, file, handler);
            cancelHeaderUploads(editor, 0);
            await expect(upload).resolves.toBe(false);
            resolve({url: '/late.png'});
            await Promise.resolve();
            expect(editor.state.doc.firstChild?.attrs['bg-image']).toBeNull();
        });

        it('should finish a superseded upload before either handler resolves', async () => {
            const editor = createView(':::header\n:::');
            const first = deferred();
            const second = deferred();
            const firstUpload = uploadBackground(editor, 0, file, first.handler);
            const secondUpload = uploadBackground(editor, 0, file, second.handler);
            await expect(firstUpload).resolves.toBe(false);
            second.resolve({url: '/new.png'});
            await expect(secondUpload).resolves.toBe(true);
            first.resolve({url: '/late.png'});
            await Promise.resolve();
            expect(editor.state.doc.firstChild?.attrs['bg-image']).toBe('/new.png');
        });

        it('should reject an unsafe uploaded address', async () => {
            const editor = createView(':::header\n:::');
            const {handler, resolve} = deferred();
            const upload = uploadBackground(editor, 0, file, handler);
            resolve({url: 'data:image/svg+xml,<svg/>'});
            await expect(upload).rejects.toThrow();
            expect(editor.state.doc.child(0).attrs['bg-image']).toBeNull();
        });
    });
});
