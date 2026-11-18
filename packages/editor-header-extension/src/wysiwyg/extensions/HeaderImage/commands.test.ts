// @vitest-environment jsdom
import {undo} from '@gravity-ui/markdown-editor/pm/history';
import {NodeSelection} from '@gravity-ui/markdown-editor/pm/state';
import {describe, expect, it} from 'vitest';

import {
    createTestEditor,
    emptyImage,
    header,
    image,
    nodePos,
    press,
    run,
    scriptUrl,
    selectNode,
    setCursor,
    textPos,
} from '../../../../tests/editor';
import {type RemovedParts, setHeaderPart, toggleHeaderPart} from '../Header/commands';

import {headerImageNodeName} from './HeaderImageSpecs';
import {
    removeHeaderImage,
    resetHeaderImage,
    selectedHeaderImage,
    setHeaderImageAttrs,
} from './commands';

const {createView, markup} = createTestEditor();

const HEADER_POS = 0;
const IMAGE_POS = 1;

describe('Header image commands', () => {
    it('should add an empty image at the start of the header and undo it', () => {
        const editor = createView(header('Text'));
        expect(run(editor, setHeaderPart(HEADER_POS, 'image', true))).toBe(true);
        expect(markup(editor)).toBe(header(emptyImage, 'Text'));
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(header('Text'));
    });

    it('should add an image to an empty header', () => {
        const editor = createView(':::header\n:::');
        expect(run(editor, setHeaderPart(HEADER_POS, 'image', true))).toBe(true);
        expect(markup(editor)).toBe(header(emptyImage));
    });

    it('should remove the image from the markup and undo the removal', () => {
        const editor = createView(header(image, 'Text'));
        expect(run(editor, setHeaderPart(HEADER_POS, 'image', false))).toBe(true);
        expect(markup(editor)).toBe(header('Text'));
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(header(image, 'Text'));
    });

    it('should restore the removed image when the switch is on again', () => {
        const editor = createView(header('::header-image{src="/a.png" alt="A" title="T"}', 'Text'));
        const removed: RemovedParts = new Map();
        const toggle = (enabled: boolean) =>
            run(editor, toggleHeaderPart(HEADER_POS, 'image', enabled, removed));
        expect(toggle(false)).toBe(true);
        expect(markup(editor)).toBe(header('Text'));
        expect(toggle(true)).toBe(true);
        expect(markup(editor)).toBe(
            header('::header-image{src="/a.png" alt="A" title="T"}', 'Text'),
        );
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(header('Text'));
        expect(toggle(true)).toBe(true);
        expect(markup(editor)).toBe(
            header('::header-image{src="/a.png" alt="A" title="T"}', 'Text'),
        );
    });

    it('should reject a change to the current state', () => {
        const editor = createView(header(image, 'Text'));
        expect(run(editor, setHeaderPart(HEADER_POS, 'image', true))).toBe(false);
        const plain = createView(header('Text'));
        expect(run(plain, setHeaderPart(HEADER_POS, 'image', false))).toBe(false);
        expect(run(plain, setHeaderPart(textPos(plain, 'Text'), 'image', true))).toBe(false);
    });

    it('should keep the cursor in the text when adding the image', () => {
        const editor = createView(header('Text'));
        setCursor(editor, textPos(editor, 'Text') + 2);
        expect(run(editor, setHeaderPart(HEADER_POS, 'image', true))).toBe(true);
        const {$from} = editor.state.selection;
        expect($from.parent.textContent).toBe('Text');
        expect($from.parentOffset).toBe(2);
    });

    it('should set a safe address in one undo step and reject an unsafe one', () => {
        const editor = createView(header(emptyImage, 'Text'));
        expect(run(editor, setHeaderImageAttrs(IMAGE_POS, {src: scriptUrl}))).toBe(false);
        expect(run(editor, setHeaderImageAttrs(IMAGE_POS, {src: '/b.png'}))).toBe(true);
        expect(markup(editor)).toBe(header('::header-image{src="/b.png"}', 'Text'));
        expect(run(editor, setHeaderImageAttrs(HEADER_POS, {src: '/b.png'}))).toBe(false);
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(header(emptyImage, 'Text'));
    });

    it('should reset the image to the placeholder', () => {
        const editor = createView(header(image, 'Text'));
        expect(run(editor, resetHeaderImage(IMAGE_POS))).toBe(true);
        expect(markup(editor)).toBe(header(emptyImage, 'Text'));
    });

    it('should remove the image and select the text after it', () => {
        const editor = createView(header(image, 'Text'));
        expect(run(editor, removeHeaderImage(IMAGE_POS))).toBe(true);
        expect(markup(editor)).toBe(header('Text'));
        expect(editor.state.selection.$from.parent.textContent).toBe('Text');
        expect(run(editor, removeHeaderImage(IMAGE_POS))).toBe(false);
    });

    it.each(['Backspace', 'Delete'])('should remove the selected image on %s', (key) => {
        const editor = createView(header(image, 'Text'));
        selectNode(editor, IMAGE_POS);
        expect(selectedHeaderImage(editor.state)?.pos).toBe(IMAGE_POS);
        expect(press(editor, key)).toBe(true);
        expect(markup(editor)).toBe(header('Text'));
    });

    it('should select the image on Backspace at the start of the text after it', () => {
        const editor = createView(header(image, 'Text'));
        setCursor(editor, textPos(editor, 'Text'));
        expect(press(editor, 'Backspace')).toBe(true);
        expect(editor.state.selection).toBeInstanceOf(NodeSelection);
        expect(editor.state.selection.from).toBe(nodePos(editor, headerImageNodeName));
        expect(markup(editor)).toBe(header(image, 'Text'));
    });
});
