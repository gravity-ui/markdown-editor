import type {Extension as CodeMirrorExtension} from '@codemirror/state';
import type {EditorView as CodeMirrorEditorView} from '@codemirror/view';

import type * as Public from '../../src';
import type * as Core from '../../src/core';
import type * as Extensions from '../../src/extensions';

export function shouldKeepTabFocusStateConstructor(api: typeof Core) {
    const State: new (initialMode?: Core.TabFocusMode) => Core.TabFocusModeState =
        api.TabFocusModeState;
    const state: Public.TabFocusModeState = new State('focus');
    const defaultState: Core.TabFocusModeState = new State();

    // @ts-expect-error The initial mode must describe Tab behavior.
    const invalidState = new State('markup');

    return {state, defaultState, invalidState};
}

export function shouldKeepTabFocusStateMethods(state: Core.TabFocusModeState) {
    const getMode: () => Core.TabFocusMode = state.getMode;
    const setMode: (mode: Public.TabFocusMode) => void = state.setMode;
    const toggle: () => void = state.toggle;
    const mode: 'focus' | 'indent' = getMode();
    const results: void[] = [setMode('focus'), setMode('indent'), toggle()];

    // @ts-expect-error The mode must describe Tab behavior.
    state.setMode('wysiwyg');
    // @ts-expect-error A mode is required.
    state.setMode();
    // @ts-expect-error Tab modes are not boolean flags.
    const invalidMode: boolean = state.getMode();

    return {mode, results, invalidMode};
}

export function shouldKeepTabFocusStateNotifications(state: Core.TabFocusModeState) {
    const listener = ({mode}: {mode: Public.TabFocusMode}) => mode;
    const onResult: void = state.on('change', listener);
    const offResult: void = state.off('change', listener);
    state.on('change', ({mode}) => {
        const value: Core.TabFocusMode = mode;
        return value;
    });

    // @ts-expect-error Event names are checked.
    state.on('changed', listener);
    // @ts-expect-error Change events carry an object with the current mode.
    state.on('change', (_mode: Core.TabFocusMode) => {});

    return {onResult, offResult};
}

export function shouldKeepModeSpecificTabFocusExtensions(
    state: Core.TabFocusModeState,
    api: typeof Public,
    extensions: typeof Extensions,
) {
    const createWysiwyg: (state: Core.TabFocusModeState) => Core.Extension =
        extensions.createWysiwygTabFocusModeExtension;
    const publicWysiwyg: typeof Extensions.createWysiwygTabFocusModeExtension =
        api.createWysiwygTabFocusModeExtension;
    const createMarkup: (state: Core.TabFocusModeState) => {
        extension: CodeMirrorExtension;
        initialize: (view: CodeMirrorEditorView) => void;
    } = api.createMarkupTabFocusMode;
    const wysiwyg: Core.Extension = createWysiwyg(state);
    const markup = createMarkup(state);
    const markupExtension: CodeMirrorExtension = markup.extension;
    const initialize: (view: CodeMirrorEditorView) => void = markup.initialize;

    // @ts-expect-error The WYSIWYG adapter requires a shared state object.
    createWysiwyg();
    // @ts-expect-error The Markdown adapter requires a shared state object.
    createMarkup('focus');
    // @ts-expect-error The Markdown adapter requires a shared state object.
    createMarkup();

    return {wysiwyg, markupExtension, initialize, publicWysiwyg};
}

export function shouldKeepMarkupTabFocusInitialization(
    api: typeof Public,
    state: Core.TabFocusModeState,
    view: CodeMirrorEditorView,
) {
    const tabFocus = api.createMarkupTabFocusMode(state);
    const result: void = tabFocus.initialize(view);

    // @ts-expect-error Initialization requires a CodeMirror view.
    tabFocus.initialize();
    // @ts-expect-error Initialization does not accept a mode instead of a view.
    tabFocus.initialize('focus');
    // @ts-expect-error Initialization does not create a new view.
    const invalidResult: CodeMirrorEditorView = tabFocus.initialize(view);

    return {result, invalidResult};
}

export function shouldKeepBundledTabFocusAPI(editor: Public.MarkdownEditorInstance) {
    const currentMode: Core.TabFocusMode = editor.tabFocusMode;
    const setMode: (mode: Core.TabFocusMode) => void = editor.setTabFocusMode;
    const result: void = setMode('focus');
    editor.on('change-tab-focus-mode', ({mode}): Core.TabFocusMode => mode);

    // @ts-expect-error Editor modes and Tab modes are separate types.
    editor.setTabFocusMode('markup');

    return {currentMode, result};
}

export function shouldExposeStandaloneTabFocusAction(editor: Core.WysiwygEditor) {
    const action: Core.Action = editor.actions.toggleTabFocusMode;
    const fromLookup: Core.Action = editor.action('toggleTabFocusMode');
    const active: boolean = action.isActive();
    const enabled: boolean = action.isEnable();
    const result: void = action.run();

    // @ts-expect-error The toggle action does not take a target mode.
    action.run('focus');

    return {fromLookup, active, enabled, result};
}
