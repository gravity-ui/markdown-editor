// @vitest-environment jsdom
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {builders} from '@gravity-ui/markdown-editor/pm/test-builder';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {describe, expect, it} from 'vitest';

import {createTestEditor, headerExtensions} from '../../../../tests/editor';
import {TestParts, testImage} from '../../../../tests/parts';
import {deferred, file, settleUpload, settledResult, uploadSrc} from '../../../../tests/upload';
import {setHeaderPart} from '../../extensions/Header/commands';
import {runCommand} from '../../extensions/commands';

import {cancelHeaderUploads} from './plugin';

const {schema, createView} = createTestEditor(headerExtensions(TestParts([testImage])));

const {p, header, image} = builders(schema, {
    p: {nodeType: 'paragraph'},
    header: {nodeType: 'header'},
    image: {nodeType: testImage},
}) as unknown as Record<string, (...content: (Node | string | object)[]) => Node>;

const IMAGE_POS = 1;

function editorWith(...blocks: Node[]) {
    const editor = createView('');
    const tr = editor.state.tr.replaceWith(0, editor.state.doc.content.size, blocks);
    editor.dispatch(tr.setSelection(TextSelection.atEnd(tr.doc)));
    return editor;
}

const srcOf = (editor: EditorView) => {
    const found: string[] = [];
    editor.state.doc.descendants((node) => {
        if (node.type.name === testImage) found.push(node.attrs.src);
    });
    return found;
};

describe('Header uploads', () => {
    it('should write the uploaded address into the node', async () => {
        const editor = editorWith(header(image(), p('Text')));
        const upload = deferred();
        const result = uploadSrc(editor, IMAGE_POS, file, upload.handler);
        settleUpload.resolves(upload);
        expect(await result).toBe(true);
        expect(srcOf(editor)).toEqual(['/uploaded.png']);
    });

    it('should follow the node when the document changes before it', async () => {
        const editor = editorWith(header(image(), p('Text')));
        const upload = deferred();
        const result = uploadSrc(editor, IMAGE_POS, file, upload.handler);
        editor.dispatch(editor.state.tr.insert(0, [p('Before'), p('More')]));
        settleUpload.resolves(upload);
        expect(await result).toBe(true);
        expect(editor.state.doc.child(2).firstChild?.attrs.src).toBe('/uploaded.png');
    });

    it('should keep the previous address when the upload fails', async () => {
        const editor = editorWith(header(image({src: '/a.png'}), p('Text')));
        const upload = deferred();
        const result = uploadSrc(editor, IMAGE_POS, file, upload.handler);
        settleUpload.rejects(upload);
        await expect(result).rejects.toThrow('Network');
        expect(srcOf(editor)).toEqual(['/a.png']);
    });

    it('should reject an unsafe uploaded address', async () => {
        const editor = editorWith(header(image({src: '/a.png'}), p('Text')));
        const result = uploadSrc(editor, IMAGE_POS, file, async () => ({
            url: 'data:image/png;base64,AAAA',
        }));
        await expect(result).rejects.toThrow('Unsupported image address');
        expect(srcOf(editor)).toEqual(['/a.png']);
    });

    it('should ignore the late response of a cancelled upload', async () => {
        const editor = editorWith(header(image(), p('Text')));
        const upload = deferred();
        const result = uploadSrc(editor, IMAGE_POS, file, upload.handler);
        cancelHeaderUploads(editor, IMAGE_POS);
        expect(await settledResult(result)).toEqual({value: false});
        settleUpload.resolves(upload);
        await settledResult(result);
        expect(srcOf(editor)).toEqual(['']);
    });

    it('should apply only the latest of two uploads into the same node', async () => {
        const editor = editorWith(header(image(), p('Text')));
        const first = deferred();
        const second = deferred();
        const stale = uploadSrc(editor, IMAGE_POS, file, first.handler);
        const latest = uploadSrc(editor, IMAGE_POS, file, second.handler);
        expect(await settledResult(stale)).toEqual({value: false});
        settleUpload.resolves(second);
        expect(await latest).toBe(true);
        settleUpload.resolves(first, '/stale.png');
        await settledResult(stale);
        expect(srcOf(editor)).toEqual(['/uploaded.png']);
    });

    it('should keep the uploads of different nodes apart', async () => {
        const editor = editorWith(header(image(), p('Text')), header(image(), p('Text')));
        const firstPos = IMAGE_POS;
        const secondPos = editor.state.doc.child(0).nodeSize + IMAGE_POS;
        const first = deferred();
        const second = deferred();
        const results = [
            uploadSrc(editor, firstPos, file, first.handler),
            uploadSrc(editor, secondPos, file, second.handler),
        ];
        settleUpload.resolves(second, '/second.png');
        settleUpload.resolves(first, '/first.png');
        expect(await Promise.all(results)).toEqual([true, true]);
        expect(srcOf(editor)).toEqual(['/first.png', '/second.png']);
    });

    it('should drop the upload of a removed node', async () => {
        const editor = editorWith(header(image(), p('Text')));
        const upload = deferred();
        const result = uploadSrc(editor, IMAGE_POS, file, upload.handler);
        expect(runCommand(editor, setHeaderPart(0, 'image', false))).toBe(true);
        expect(await settledResult(result)).toEqual({value: false});
        settleUpload.resolves(upload);
        await settledResult(result);
        expect(srcOf(editor)).toEqual([]);
    });

    it('should drop the upload of a node moved by cut and paste', async () => {
        const editor = editorWith(header(image(), p('Text')), p('After'));
        const upload = deferred();
        const result = uploadSrc(editor, IMAGE_POS, file, upload.handler);
        const banner = editor.state.doc.child(0);
        const tr = editor.state.tr.delete(0, banner.nodeSize);
        editor.dispatch(tr.insert(tr.doc.content.size, banner));
        expect(await settledResult(result)).toEqual({value: false});
        settleUpload.resolves(upload);
        await settledResult(result);
        expect(srcOf(editor)).toEqual(['']);
    });

    it('should leave a document without uploads unchanged on cancel', () => {
        const editor = editorWith(header(image(), p('Text')));
        const {state} = editor;
        cancelHeaderUploads(editor, IMAGE_POS);
        expect(editor.state).toBe(state);
    });
});
