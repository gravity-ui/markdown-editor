import type {EditorView} from '@codemirror/view';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {Logger2} from '../../logger';
import {ReactRenderStorage} from '../../modules/react-renderer';
import {DirectiveSyntaxContext} from '../../utils/directive';

import {createCodemirror} from './create';

vi.hoisted(() => {
    Object.defineProperty(window.navigator, 'platform', {value: 'Win32', configurable: true});
});

const views: EditorView[] = [];
const resetEvents = [
    {type: 'paste', doc: 'pastedtext'},
    {type: 'cut', doc: ''},
    {type: 'drop', doc: 'droppedtext'},
    {type: 'compositionstart', doc: 'text'},
    {type: 'pointerdown', doc: 'text'},
    {type: 'input', doc: 'text'},
] as const;

type ResetEvent = (typeof resetEvents)[number]['type'];

function createView(enableTabExitOnEscape = true) {
    const view = createCodemirror({
        doc: 'text',
        placeholder: '',
        logger: new Logger2(),
        onCancel: () => undefined,
        enableTabExitOnEscape,
        onSubmit: () => undefined,
        onChange: () => undefined,
        onDocChange: () => undefined,
        onScroll: () => undefined,
        reactRenderer: new ReactRenderStorage(),
        directiveSyntax: new DirectiveSyntaxContext(undefined),
        preserveEmptyRows: false,
        searchPanel: false,
    });

    views.push(view);
    document.body.append(view.dom);
    view.focus();
    return view;
}

function pressKey(view: EditorView, init: KeyboardEventInit) {
    const event = new KeyboardEvent('keydown', {bubbles: true, cancelable: true, ...init});
    view.contentDOM.dispatchEvent(event);
    return event;
}

function pressEscape(view: EditorView) {
    return pressKey(view, {key: 'Escape', code: 'Escape', keyCode: 27});
}

function pressTab(view: EditorView, modifiers: KeyboardEventInit = {}) {
    return pressKey(view, {key: 'Tab', code: 'Tab', keyCode: 9, ...modifiers});
}

function pressCtrlM(view: EditorView) {
    return pressKey(view, {key: 'm', code: 'KeyM', keyCode: 77, ctrlKey: true});
}

function createDataTransfer(text: string): DataTransfer {
    return {
        dropEffect: 'none',
        effectAllowed: 'all',
        files: [] as unknown as FileList,
        items: [] as unknown as DataTransferItemList,
        types: ['text/plain'],
        getData: (type: string) => (type === 'text/plain' || type === 'Text' ? text : ''),
        setData: () => undefined,
        clearData: () => undefined,
        setDragImage: () => undefined,
    };
}

function dispatchResetEvent(view: EditorView, type: ResetEvent) {
    const event = new Event(type, {bubbles: true, cancelable: true});

    if (type === 'paste' || type === 'cut') {
        Object.defineProperty(event, 'clipboardData', {value: createDataTransfer('pasted')});
    }
    if (type === 'drop') {
        Object.defineProperty(event, 'dataTransfer', {value: createDataTransfer('dropped')});
        vi.spyOn(view, 'posAtCoords').mockReturnValue(0);
    }

    view.contentDOM.dispatchEvent(event);

    if (type === 'compositionstart') {
        view.contentDOM.dispatchEvent(new CompositionEvent('compositionend', {bubbles: true}));
        // Move past CodeMirror's suppression of keys immediately following compositionend.
        vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 200);
    }

    return event;
}

afterEach(() => {
    for (const view of views.splice(0)) {
        view.destroy();
        view.dom.remove();
    }
    vi.restoreAllMocks();
});

describe('markup editor Tab exit after Escape', () => {
    it('should leave Tab and Shift+Tab to the browser after Escape', () => {
        const view = createView();

        pressEscape(view);

        expect(pressTab(view).defaultPrevented).toBe(false);
        expect(pressTab(view, {shiftKey: true}).defaultPrevented).toBe(false);
        expect(view.state.sliceDoc()).toBe('text');
    });

    it('should keep editor Tab handling when Escape exit is disabled', () => {
        const view = createView(false);

        pressEscape(view);

        expect(pressTab(view).defaultPrevented).toBe(true);
        expect(view.state.sliceDoc()).toBe('\ttext');
    });

    it('should restore editor Tab handling after an ordinary key', () => {
        const view = createView();

        pressEscape(view);
        expect(pressTab(view).defaultPrevented).toBe(false);

        expect(pressKey(view, {key: 'a', code: 'KeyA', keyCode: 65}).defaultPrevented).toBe(false);

        expect(pressTab(view).defaultPrevented).toBe(true);
        expect(view.state.sliceDoc()).toBe('\ttext');
    });

    it('should disable the Ctrl+M shortcut when Escape navigation is enabled', () => {
        const view = createView(true);

        expect(pressCtrlM(view).defaultPrevented).toBe(false);
        expect(view.state.sliceDoc()).toBe('text');

        expect(pressTab(view).defaultPrevented).toBe(true);
        expect(view.state.sliceDoc()).toBe('\ttext');
    });

    it('should toggle persistent Tab navigation when Escape navigation is disabled', () => {
        const view = createView(false);

        expect(pressCtrlM(view).defaultPrevented).toBe(true);
        expect(pressTab(view).defaultPrevented).toBe(false);
        expect(view.state.sliceDoc()).toBe('text');

        expect(pressCtrlM(view).defaultPrevented).toBe(true);
        expect(pressTab(view).defaultPrevented).toBe(true);
        expect(view.state.sliceDoc()).toBe('\ttext');
    });

    it.each([
        {key: 'Shift', code: 'ShiftLeft', keyCode: 16, shiftKey: true},
        {key: 'Control', code: 'ControlLeft', keyCode: 17, ctrlKey: true},
        {key: 'Alt', code: 'AltLeft', keyCode: 18, altKey: true},
        {key: 'Meta', code: 'MetaLeft', keyCode: 91, metaKey: true},
    ])('should preserve Tab exit after pressing $key alone', (modifier) => {
        const view = createView();

        pressEscape(view);
        pressKey(view, modifier);

        expect(pressTab(view).defaultPrevented).toBe(false);
        expect(view.state.sliceDoc()).toBe('text');
    });

    it.each(resetEvents)('should restore editor Tab handling after $type', ({type, doc}) => {
        const view = createView();

        pressEscape(view);
        expect(pressTab(view).defaultPrevented).toBe(false);

        dispatchResetEvent(view, type);
        expect(view.state.sliceDoc()).toBe(doc);

        expect(pressTab(view).defaultPrevented).toBe(true);
        expect(view.state.sliceDoc()).not.toBe(doc);
    });
});
