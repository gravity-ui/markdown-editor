import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from '../../../core';
import {BaseSchemaSpecs} from '../../base/specs';

import {TooltipView} from './tooltip';

import {SelectionContext} from './index';

const views: EditorView[] = [];

/**
 * Mounts a focused editor with `<hello> world` selected. `show`/`hide` stand in for the
 * real ones: those render a React popup through the ReactRenderer extension, while the
 * gating logic under test only decides when they are called
 */
function setup() {
    const show = vi.spyOn(TooltipView.prototype, 'show').mockImplementation(() => {});
    const hide = vi.spyOn(TooltipView.prototype, 'hide').mockImplementation(() => {});

    const {schema, plugins} = new ExtensionsManager({
        extensions: (builder) =>
            builder.use(BaseSchemaSpecs, {}).use(SelectionContext, {config: [[]]}),
    }).build();

    const {doc, paragraph: p} = builders(schema);
    const initialDoc = doc(p('hello world'));
    const view = new EditorView(document.body.appendChild(document.createElement('div')), {
        state: EditorState.create({
            doc: initialDoc,
            selection: TextSelection.create(initialDoc, 1, 6),
            plugins,
        }),
    });
    vi.spyOn(view, 'hasFocus').mockReturnValue(true);
    views.push(view);

    show.mockClear();
    hide.mockClear();
    return {view, show, hide};
}

/** Runs the plugin's mousedown handler the way prosemirror-view runs it on a press */
function pressMouse(view: EditorView, init: MouseEventInit = {button: 0, buttons: 1}): void {
    const event = new MouseEvent('mousedown', init);
    view.someProp('handleDOMEvents', (handlers) => handlers.mousedown?.(view, event));
}

function releaseMouse(init: MouseEventInit = {button: 0, buttons: 0}): void {
    document.dispatchEvent(new MouseEvent('mouseup', init));
}

function pressKey(): void {
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight'}));
}

function selectRange(view: EditorView, from: number, to: number): void {
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)));
}

/**
 * `EditorState.create` always builds a fresh plugins array, and ProseMirror answers a
 * plugins identity change by destroying and re-creating every plugin view
 */
function recreatePluginViews(view: EditorView): void {
    view.updateState(
        EditorState.create({
            doc: view.state.doc,
            selection: view.state.selection,
            plugins: view.state.plugins,
        }),
    );
}

afterEach(() => {
    releaseMouse(); // release a gate still armed by a test
    for (const view of views.splice(0)) view.destroy();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
});

describe('SelectionContext', () => {
    it('should hide the tooltip while the button is held and show it on release', () => {
        const {view, show, hide} = setup();

        pressMouse(view);
        expect(hide).toHaveBeenCalledTimes(1);

        selectRange(view, 1, 12); // the selection grows under the held button
        expect(show).not.toHaveBeenCalled();

        releaseMouse();
        expect(show).toHaveBeenCalledTimes(1);
    });

    it('should show the tooltip after a click that leaves the selection unchanged', () => {
        const {view, show} = setup();

        // Re-selecting the same word dispatches no transaction, but the press has hidden
        // the tooltip — leaving it hidden over a live selection
        pressMouse(view);
        releaseMouse();

        expect(show).toHaveBeenCalledTimes(1);
    });

    it('should keep working after a host-side state swap re-creates the plugin views', () => {
        const {view, show} = setup();

        recreatePluginViews(view);
        show.mockClear(); // the re-created plugin view shows the tooltip for the live selection

        pressMouse(view);
        releaseMouse();

        expect(show).toHaveBeenCalledTimes(1);
    });

    it('should stay gated when the plugin views are re-created mid-press', () => {
        const {view, show} = setup();

        pressMouse(view);
        recreatePluginViews(view);
        selectRange(view, 1, 12);
        expect(show).not.toHaveBeenCalled();

        releaseMouse();
        expect(show).toHaveBeenCalledTimes(1);
    });

    it('should stay gated on a secondary-button release while the primary one is held', () => {
        const {view, show} = setup();

        pressMouse(view);
        releaseMouse({button: 1, buttons: 1}); // a middle-button tap during a drag
        selectRange(view, 1, 12);
        expect(show).not.toHaveBeenCalled();

        releaseMouse();
        expect(show).toHaveBeenCalledTimes(1);
    });

    it('should end a press whose release never reaches the page', () => {
        const {view, show} = setup();

        // A right press opens the native context menu, which swallows the mouseup — and
        // may select the word underneath, which must not pop the tooltip up under the menu
        pressMouse(view, {button: 2, buttons: 2});
        selectRange(view, 1, 12);
        expect(show).not.toHaveBeenCalled();

        pressKey();
        expect(show).toHaveBeenCalledTimes(1);
    });

    it('should end a press that turns into a native drag', () => {
        const {view, show} = setup();

        // A drag ends with dragend, not with a mouseup
        pressMouse(view);
        document.dispatchEvent(new Event('dragend'));

        expect(show).toHaveBeenCalledTimes(1);
    });
});
