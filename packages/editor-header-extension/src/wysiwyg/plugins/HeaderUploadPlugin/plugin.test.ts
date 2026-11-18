// @vitest-environment jsdom
import {describe, expect, it} from 'vitest';

import {createTestEditor, emptyImage, header, image, run} from '../../../../tests/editor';
import {deferred, file, settleUpload, settledResult, uploadImage} from '../../../../tests/upload';
import {setHeaderPart} from '../../extensions/Header/commands';

import {cancelHeaderUploads} from './plugin';

const {createView, markup} = createTestEditor();

const IMAGE_POS = 1;
const uploaded = header('::header-image{src="/uploaded.png"}', 'Text');

describe('Header uploads', () => {
    it('should set the uploaded address of the image', async () => {
        const editor = createView(header(emptyImage, 'Text'));
        const upload = deferred();
        const result = uploadImage(editor, IMAGE_POS, file, upload.handler);
        settleUpload.resolves(upload);
        expect(await result).toBe(true);
        expect(markup(editor)).toBe(uploaded);
    });

    it('should keep the previous image when the upload fails', async () => {
        const editor = createView(header(image, 'Text'));
        const upload = deferred();
        const result = uploadImage(editor, IMAGE_POS, file, upload.handler);
        settleUpload.rejects(upload);
        await expect(result).rejects.toThrow('Network');
        expect(markup(editor)).toBe(header(image, 'Text'));
    });

    it('should reject an unsafe uploaded address', async () => {
        const editor = createView(header(image, 'Text'));
        const result = uploadImage(editor, IMAGE_POS, file, async () => ({
            url: 'data:image/png;base64,AAAA',
        }));
        await expect(result).rejects.toThrow('Unsupported image address');
        expect(markup(editor)).toBe(header(image, 'Text'));
    });

    it('should ignore the response of a cancelled upload', async () => {
        const editor = createView(header(emptyImage, 'Text'));
        const upload = deferred();
        const result = uploadImage(editor, IMAGE_POS, file, upload.handler);
        cancelHeaderUploads(editor, IMAGE_POS);
        expect(await settledResult(result)).toEqual({value: false});
        settleUpload.resolves(upload);
        expect(markup(editor)).toBe(header(emptyImage, 'Text'));
    });

    it('should apply only the latest of two uploads', async () => {
        const editor = createView(header(emptyImage, 'Text'));
        const first = deferred();
        const second = deferred();
        const stale = uploadImage(editor, IMAGE_POS, file, first.handler);
        const latest = uploadImage(editor, IMAGE_POS, file, second.handler);
        expect(await settledResult(stale)).toEqual({value: false});
        settleUpload.resolves(second);
        expect(await latest).toBe(true);
        settleUpload.resolves(first, '/stale.png');
        await settledResult(stale);
        expect(markup(editor)).toBe(uploaded);
    });

    it('should drop the upload of a removed image', async () => {
        const editor = createView(header(emptyImage, 'Text'));
        const upload = deferred();
        const result = uploadImage(editor, IMAGE_POS, file, upload.handler);
        expect(run(editor, setHeaderPart(0, 'image', false))).toBe(true);
        expect(await settledResult(result)).toEqual({value: false});
        settleUpload.resolves(upload);
        expect(markup(editor)).toBe(header('Text'));
    });
});
