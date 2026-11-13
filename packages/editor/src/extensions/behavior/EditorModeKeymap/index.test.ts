import {TextSelection} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {DataTransferMock} from '../../../../tests/event-mock';
import {BundlePreset} from '../../../bundle/wysiwyg-preset';
import {WysiwygEditor} from '../../../core';
import {ReactRenderStorage} from '../../../modules/react-renderer';
import {DirectiveSyntaxContext} from '../../../utils/directive';
import {getAutocompleteState, openAutocomplete} from '../Autocomplete';
import {openSearch} from '../Search/commands';
import {pluginKey as searchPluginKey} from '../Search/const';

const mountedEditors: {editor: WysiwygEditor; host: HTMLElement}[] = [];

afterEach(() => {
    for (const {editor, host} of mountedEditors.splice(0)) {
        editor.destroy();
        host.remove();
    }
});

function createEditor(
    enableTabExitOnEscape = true,
    options: {initialContent?: string; mobile?: boolean; searchPanel?: boolean} = {},
) {
    const host = document.createElement('div');
    document.body.append(host);
    const onCancel = vi.fn(() => true);
    const editor = new WysiwygEditor({
        domElem: host,
        initialContent: options.initialContent ?? '```\ntext\n```',
        extensions: (builder) =>
            builder.use(BundlePreset, {
                preset: 'commonmark',
                reactRenderer: new ReactRenderStorage(),
                directiveSyntax: new DirectiveSyntaxContext(undefined),
                searchPanel: options.searchPanel ?? false,
                mobile: options.mobile ?? true,
                enableTabExitOnEscape,
                onCancel,
            }),
    });
    mountedEditors.push({editor, host});
    const {view} = editor;
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1)));
    view.focus();
    expect(view.hasFocus()).toBe(true);

    return {view, onCancel};
}

function pressKey(view: EditorView, key: string, init: KeyboardEventInit = {}) {
    const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        ...init,
    });
    view.dom.dispatchEvent(event);
    return event;
}

describe('EditorModeKeymap in BundlePreset', () => {
    it('should keep handling Tab after Escape when tab exit is disabled', () => {
        const {view, onCancel} = createEditor(false);

        pressKey(view, 'Escape');

        expect(onCancel).toHaveBeenCalledOnce();
        expect(pressKey(view, 'Tab').defaultPrevented).toBe(true);
        expect(view.state.doc.textContent).toBe('\ttext');
    });

    it('should restore code indentation after another key follows Escape', () => {
        const {view} = createEditor();

        pressKey(view, 'Escape');

        expect(pressKey(view, 'Tab').defaultPrevented).toBe(false);
        expect(view.state.doc.textContent).toBe('text');

        pressKey(view, 'x');

        expect(pressKey(view, 'Tab').defaultPrevented).toBe(true);
        expect(view.state.doc.textContent).toBe('\ttext');
    });

    it('should restore code indentation after a paste without a preceding keydown', () => {
        const {view, onCancel} = createEditor();
        const clipboardData = new DataTransferMock();
        clipboardData.setData('text/plain', 'pasted');
        const paste = new Event('paste', {bubbles: true, cancelable: true});
        Object.defineProperty(paste, 'clipboardData', {value: clipboardData});

        pressKey(view, 'Escape');
        expect(onCancel).toHaveBeenCalledOnce();
        view.dom.dispatchEvent(paste);

        expect(paste.defaultPrevented).toBe(true);
        expect(view.state.doc.textContent).toBe('pastedtext');
        expect(view.hasFocus()).toBe(true);
        expect(pressKey(view, 'Tab').defaultPrevented).toBe(true);
        expect(view.state.doc.textContent).toBe('pasted\ttext');
    });

    it('should close search before allowing Tab exit on a subsequent Escape', () => {
        const {view, onCancel} = createEditor(true, {mobile: false, searchPanel: true});
        openSearch(view.state, view.dispatch);
        expect(searchPluginKey.getState(view.state)?.open).toBe(true);

        pressKey(view, 'Escape');

        expect(searchPluginKey.getState(view.state)?.open).toBe(false);
        expect(onCancel).not.toHaveBeenCalled();
        expect(pressKey(view, 'Tab').defaultPrevented).toBe(true);

        pressKey(view, 'Escape');

        expect(onCancel).toHaveBeenCalledOnce();
        expect(pressKey(view, 'Tab').defaultPrevented).toBe(false);
    });

    it('should close the selection toolbar before allowing Tab exit on a subsequent Escape', () => {
        const {view, onCancel} = createEditor(true, {initialContent: 'text', mobile: false});
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 5)));

        pressKey(view, 'Escape');

        expect(onCancel).not.toHaveBeenCalled();
        expect(pressKey(view, 'Tab').defaultPrevented).toBe(true);

        pressKey(view, 'Escape');

        expect(onCancel).toHaveBeenCalledOnce();
        expect(pressKey(view, 'Tab').defaultPrevented).toBe(false);
    });

    it('should close the command menu before allowing Tab exit on a subsequent Escape', () => {
        const {view, onCancel} = createEditor(true, {initialContent: 'text', mobile: false});
        openAutocomplete(view, '/');
        expect(getAutocompleteState(view.state)?.active).toBe(true);

        pressKey(view, 'Escape');

        expect(getAutocompleteState(view.state)?.active).toBe(false);
        expect(onCancel).not.toHaveBeenCalled();
        expect(pressKey(view, 'Tab').defaultPrevented).toBe(true);

        pressKey(view, 'Escape');

        expect(onCancel).toHaveBeenCalledOnce();
        expect(pressKey(view, 'Tab').defaultPrevented).toBe(false);
    });

    it.each(['Shift', 'Control', 'Alt', 'Meta'])(
        'should preserve tab exit after pressing %s following Escape',
        (key) => {
            const {view} = createEditor();

            pressKey(view, 'Escape');
            pressKey(view, key);

            expect(pressKey(view, 'Tab').defaultPrevented).toBe(false);
            expect(view.state.doc.textContent).toBe('text');
        },
    );
});
