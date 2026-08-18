import {EditorState, type Plugin, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {ExtensionsManager} from '../../../core';
import {Logger2} from '../../../logger';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {SelectionContext} from './index';

const logger = new Logger2().nested({env: 'test'});

const views: EditorView[] = [];

/**
 * Builds the SelectionContext plugin through the public extension and replaces its
 * TooltipView's show/hide with recorders (the real ones render a React popup and
 * need the ReactRenderer extension; the plugin's gating logic under test does not),
 * then mounts a focused editor view with `<hello> world` selected
 */
function setup() {
    const {schema, plugins} = new ExtensionsManager({
        extensions: (builder) =>
            builder.use(BaseSchemaSpecs, {}).use(SelectionContext, {config: [[]]}),
        logger,
    }).build();
    const plugin = plugins[0];
    const {tooltip} = plugin.spec as unknown as {
        tooltip: {show(view: EditorView): void; hide(view: EditorView): void};
    };
    const show = jest.spyOn(tooltip, 'show').mockImplementation(() => {});
    const hide = jest.spyOn(tooltip, 'hide').mockImplementation(() => {});

    const {doc, p} = builders<'doc' | 'p'>(schema, {
        doc: {nodeType: BaseNode.Doc},
        p: {nodeType: BaseNode.Paragraph},
    });
    const initialDoc = doc(p('hello world'));
    const view = new EditorView(document.body.appendChild(document.createElement('div')), {
        state: EditorState.create({
            doc: initialDoc,
            selection: TextSelection.create(initialDoc, 1, 6),
            plugins: [plugin],
        }),
    });
    jest.spyOn(view, 'hasFocus').mockReturnValue(true);
    views.push(view);

    return {plugin, view, show, hide};
}

/** Calls the plugin's mousedown DOM-event handler, as prosemirror-view does on a press */
function press(plugin: Plugin, view: EditorView, init: MouseEventInit = {}): void {
    plugin.props.handleDOMEvents?.mousedown?.call(
        plugin,
        view,
        new MouseEvent('mousedown', {button: 0, ...init}),
    );
}

/** The document-level mouseup release the plugin's press gate waits for */
function releaseMouse(button = 0): void {
    document.dispatchEvent(new MouseEvent('mouseup', {button}));
}

/** A document-level keydown — the input that releases a context-menu press gate */
function pressKey(): void {
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight'}));
}

function changeSelection(view: EditorView, from: number, to: number): void {
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)));
}

/**
 * Swaps in a state built by EditorState.create: it always builds a fresh plugins array,
 * and prosemirror-view responds by destroying and re-creating every plugin view
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
    releaseMouse(); // flush any still-armed press gate
    for (const view of views.splice(0)) view.destroy();
    document.body.innerHTML = '';
    jest.restoreAllMocks();
});

describe('SelectionContext', () => {
    it('shows the tooltip after a mouse selection (press → select → release)', () => {
        const {plugin, view, show, hide} = setup();
        show.mockClear();
        hide.mockClear();

        press(plugin, view);
        expect(hide).toHaveBeenCalledTimes(1); // the press hides the tooltip…
        changeSelection(view, 1, 12); // …selection grows while pressed (updates are gated)…
        expect(show).not.toHaveBeenCalled();
        releaseMouse(); // …and the release re-evaluates and shows it

        expect(show).toHaveBeenCalledTimes(1);
    });

    it('re-shows the tooltip on a click that keeps doc and selection unchanged', () => {
        const {plugin, view, show} = setup();
        show.mockClear();

        // Press and release over the existing selection (e.g. re-selecting the same word):
        // doc and selection are unchanged, but the press just hid the tooltip —
        // "unchanged" must not strand it hidden over a live selection
        press(plugin, view);
        releaseMouse();

        expect(show).toHaveBeenCalledTimes(1);
    });

    it('shows the tooltip after a host-side state swap re-creates the plugin views', () => {
        const {plugin, view, show} = setup();

        recreatePluginViews(view);
        show.mockClear();

        // One click over the unchanged selection: a release ignored because of the
        // re-creation would leave the tooltip hidden forever
        press(plugin, view);
        releaseMouse();

        expect(show).toHaveBeenCalledTimes(1);
    });

    it('keeps the press gate through a mid-press plugin view re-creation', () => {
        const {plugin, view, show} = setup();
        show.mockClear();

        // A host-side state swap while the button is still held must not un-gate
        // updates: the tooltip would show and chase the cursor for the rest of the drag
        press(plugin, view);
        recreatePluginViews(view);
        changeSelection(view, 1, 12);
        expect(show).not.toHaveBeenCalled();

        releaseMouse();
        expect(show).toHaveBeenCalledTimes(1);
    });

    it('gates updates during a non-primary press and releases on the next input', () => {
        const {plugin, view, show, hide} = setup();
        show.mockClear();
        hide.mockClear();

        // A right press hides the tooltip and may open the native context menu: the menu
        // can swallow the release, and the press itself may select the clicked word —
        // that selection must not pop the tooltip up under the open menu
        press(plugin, view, {button: 2});
        expect(hide).toHaveBeenCalledTimes(1);
        changeSelection(view, 1, 12); // the browser's word-selection on right-click
        expect(show).not.toHaveBeenCalled();

        // The menu can swallow the mouseup, so the next input reaching the page
        // releases the gate (e.g. a keyboard-driven selection)
        pressKey();
        changeSelection(view, 1, 6);

        expect(show).toHaveBeenCalledTimes(1);
    });

    it('treats ctrl+click on macOS as a context-menu press (reported with button 0)', () => {
        jest.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
        const {plugin, view, show} = setup();
        show.mockClear();

        // macOS opens the native context menu for ctrl+click and swallows the mouseup;
        // arming the primary mouseup gate would leave it stuck and block all updates
        press(plugin, view, {button: 0, ctrlKey: true});
        changeSelection(view, 1, 12); // the browser's word-selection under the menu
        expect(show).not.toHaveBeenCalled();

        pressKey(); // the next input releases the gate…
        changeSelection(view, 1, 6); // …and a later selection shows the tooltip again

        expect(show).toHaveBeenCalledTimes(1);
    });

    it('treats ctrl+click elsewhere as a primary press', () => {
        jest.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
        const {plugin, view, show} = setup();
        show.mockClear();

        // Outside macOS ctrl+click doesn't open the context menu — the ordinary
        // press-release cycle applies, including the unchanged-selection re-show
        press(plugin, view, {button: 0, ctrlKey: true});
        releaseMouse();

        expect(show).toHaveBeenCalledTimes(1);
    });

    it('ignores a secondary-button release while the primary button is held', () => {
        const {plugin, view, show} = setup();
        show.mockClear();

        // A middle/right-button tap during a left drag must not consume the gate:
        // the tooltip would show over the still-growing selection
        press(plugin, view);
        releaseMouse(1);
        changeSelection(view, 1, 12);
        expect(show).not.toHaveBeenCalled();

        releaseMouse();
        expect(show).toHaveBeenCalledTimes(1);
    });

    it('releases the gate when the press turns into a native drag', () => {
        const {plugin, view, show} = setup();
        show.mockClear();

        // A drag ends with dragend, not mouseup — dragstart must release the gate
        press(plugin, view);
        plugin.props.handleDOMEvents?.dragstart?.call(
            plugin,
            view,
            new Event('dragstart') as DragEvent,
        );
        changeSelection(view, 1, 12);
        expect(show).toHaveBeenCalledTimes(1);

        // …and disarm the pending mouseup listener: a later unrelated mouseup must
        // not spuriously re-evaluate (e.g. re-show a tooltip the user just dismissed)
        releaseMouse();
        expect(show).toHaveBeenCalledTimes(1);
    });
});
