// @vitest-environment jsdom
import {NodeSelection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {act} from 'react-dom/test-utils';
import {assert, describe, expect, it} from 'vitest';

import {header} from '../../../../../../tests/editor';
import {byQa, createEditorWithRenderer, settle} from '../../../../../../tests/toolbar';
import {deferred, file} from '../../../../../../tests/upload';
import {runCommand} from '../../../commands';
import {removeHeaderImage, selectedHeaderImage} from '../../commands';

import {isHeaderImagePopupOpen} from './plugin';

const IMAGE_POS = 1;
const image = '::header-image{src="/a.png" alt="A"}';
const emptyImage = '::header-image';

const popup = () => byQa('header-image');
const buttonNamed = (name: string) =>
    Array.from(popup()?.querySelectorAll<HTMLElement>('button, [role="tab"]') ?? []).find(
        (button) => button.textContent === name || button.getAttribute('aria-label') === name,
    );
const linkInput = () => popup()?.querySelector<HTMLInputElement>('input[placeholder="https://"]');

async function typeInto(input: HTMLInputElement | null | undefined, value: string) {
    await act(async () => {
        if (!input) return;
        const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        setValue?.call(input, value);
        input.dispatchEvent(new Event('input', {bubbles: true}));
    });
}

async function attach(selected: File) {
    await act(async () => {
        const input = popup()?.querySelector<HTMLInputElement>('input[type="file"]');
        if (!input) return;
        Object.defineProperty(input, 'files', {value: [selected], configurable: true});
        input.dispatchEvent(new Event('change', {bubbles: true}));
    });
}

const keyDown = (target: Element | null | undefined, key: string, init: KeyboardEventInit = {}) =>
    act(async () => {
        target?.dispatchEvent(
            new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true, ...init}),
        );
    });

const press = (editor: EditorView, key: string) =>
    act(async () => {
        editor.someProp('handleKeyDown', (handle) =>
            handle(editor, new KeyboardEvent('keydown', {key})),
        );
    });

function selectImage(editor: EditorView, pos = IMAGE_POS) {
    editor.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)));
}

async function openPopup(editor: EditorView, pos = IMAGE_POS) {
    selectImage(editor, pos);
    await press(editor, 'Enter');
    await settle(popup);
}

describe('Header image popup', () => {
    const upload = {pending: deferred()};
    const {start, markup} = createEditorWithRenderer(undefined, {
        fileUploadHandler: () => upload.pending.handler(),
    });

    const startUpload = async (source: string) => {
        upload.pending = deferred();
        const editor = await start(source);
        await openPopup(editor);
        await attach(file);
        return editor;
    };

    it('should open on Enter and close on Escape with the focus back in the editor', async () => {
        const editor = await start(header(image, 'Text'));
        await openPopup(editor);
        expect(popup()?.contains(document.activeElement)).toBe(true);
        expect(buttonNamed('Replace file')).toBe(document.activeElement);
        await keyDown(document.activeElement, 'Escape');
        await settle(() => !popup());
        expect(editor.hasFocus()).toBe(true);
        expect(selectedHeaderImage(editor.state)?.pos).toBe(IMAGE_POS);
        expect(isHeaderImagePopupOpen(editor.state)).toBe(false);
    });

    it('should close on Tab from the last control with the focus back in the editor', async () => {
        const editor = await start(header(image, 'Text'));
        await openPopup(editor);
        await keyDown(buttonNamed('Reset'), 'Tab');
        await settle(() => !popup());
        expect(editor.hasFocus()).toBe(true);
        expect(selectedHeaderImage(editor.state)?.pos).toBe(IMAGE_POS);
    });

    it.each([
        ['the image', image, false],
        ['the image that is already selected', image, true],
        ['the placeholder', emptyImage, false],
        ['the placeholder that is already selected', emptyImage, true],
    ])('should select and open on a press on %s', async (_name, block, selected) => {
        const editor = await start(header(block, 'Text'));
        if (selected) selectImage(editor);
        const target = editor.nodeDOM(IMAGE_POS);
        assert(target instanceof HTMLElement);
        const event = new MouseEvent('mousedown', {bubbles: true, cancelable: true, button: 0});
        // A press on the icon of the placeholder or on the image itself.
        const pressed = target.firstElementChild ?? target;
        await act(async () => {
            pressed.dispatchEvent(event);
        });
        await settle(popup);
        expect(event.defaultPrevented).toBe(true);
        expect(selectedHeaderImage(editor.state)?.pos).toBe(IMAGE_POS);
        expect(isHeaderImagePopupOpen(editor.state)).toBe(true);
    });

    it('should close when the image is no longer selected', async () => {
        const editor = await start(header(image, 'Text'));
        await openPopup(editor);
        await act(async () => runCommand(editor, removeHeaderImage(IMAGE_POS)));
        await settle(() => !popup());
    });

    it('should set the image by a link', async () => {
        const editor = await start(header(emptyImage, 'Text'));
        await openPopup(editor);
        await act(async () => buttonNamed('Add by link')?.click());
        await typeInto(linkInput(), '/b.png');
        await act(async () => buttonNamed('Submit')?.click());
        expect(markup(editor)).toBe(header('::header-image{src="/b.png"}', 'Text'));
        await settle(() => buttonNamed('Replace file'));
    });

    it('should reset the image to a placeholder', async () => {
        const editor = await start(header(image, 'Text'));
        await openPopup(editor);
        await act(async () => buttonNamed('Reset')?.click());
        expect(markup(editor)).toBe(header('::header-image{alt="A"}', 'Text'));
        await settle(() => !buttonNamed('Reset'));
        expect(popup()).not.toBeNull();
    });

    it('should write the uploaded address into the image', async () => {
        const editor = await startUpload(header(emptyImage, 'Text'));
        upload.pending.resolve({url: '/b.png'});
        await settle(() => markup(editor).includes('/b.png'));
        expect(markup(editor)).toBe(header('::header-image{src="/b.png"}', 'Text'));
    });

    it('should not write the result of an upload after the popup is closed', async () => {
        const editor = await startUpload(header(emptyImage, 'Text'));
        await keyDown(document.activeElement, 'Escape');
        await settle(() => !popup());
        const {doc} = editor.state;
        upload.pending.resolve({url: '/b.png'});
        await settle();
        expect(editor.state.doc).toBe(doc);
    });

    it('should not write the result of an upload after a link is set', async () => {
        const editor = await startUpload(header(emptyImage, 'Text'));
        await act(async () => buttonNamed('Add by link')?.click());
        await typeInto(linkInput(), '/link.png');
        await act(async () => buttonNamed('Submit')?.click());
        expect(markup(editor)).toBe(header('::header-image{src="/link.png"}', 'Text'));
        upload.pending.resolve({url: '/uploaded.png'});
        await settle();
        expect(markup(editor)).toBe(header('::header-image{src="/link.png"}', 'Text'));
    });

    it('should write the result of an upload into the image that moved', async () => {
        const editor = await startUpload(header(emptyImage, 'Text'));
        await act(async () => {
            const paragraph = editor.state.schema.nodes.paragraph.create(
                null,
                editor.state.schema.text('Before'),
            );
            editor.dispatch(editor.state.tr.insert(0, paragraph));
        });
        upload.pending.resolve({url: '/b.png'});
        await settle(() => markup(editor).includes('/b.png'));
        expect(markup(editor)).toBe(`Before\n\n${header('::header-image{src="/b.png"}', 'Text')}`);
    });

    it('should not write the result of an upload after the image is removed', async () => {
        const editor = await startUpload(header(emptyImage, 'Text'));
        await act(async () => runCommand(editor, removeHeaderImage(IMAGE_POS)));
        await settle(() => !popup());
        const {doc} = editor.state;
        upload.pending.resolve({url: '/b.png'});
        await settle();
        expect(editor.state.doc).toBe(doc);
    });
});
