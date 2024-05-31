import type {EditorState, Transaction} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

export type CommandWithAttrs<T = Record<string, string>> = (
    state: EditorState,
    dispatch?: (tr: Transaction) => void,
    view?: EditorView,
    attrs?: T,
) => boolean;

export interface ActionSpec {
    /** @default () => false */
    isActive?(state: EditorState): boolean;
    isEnable(
        state: EditorState,
        dispatch: undefined,
        view: EditorView,
        attrs?: Record<string, unknown>,
    ): boolean;
    run(
        state: EditorState,
        dispatch: EditorView['dispatch'],
        view: EditorView,
        attrs?: Record<string, unknown>,
    ): void; // same as prosemirror command
    /** @default () => {} */
    meta?(state: EditorState): any;
}

export interface Action<A extends {} = never, M = unknown> {
    isActive(): boolean;
    isEnable(args?: Record<string, unknown>): boolean;
    run(...args: A extends never ? [] : [A]): void;
    meta(): M;
}

export interface ActionStorage {
    actions: WysiwygEditor.Actions;
    action<T extends keyof WysiwygEditor.Actions>(actionName: T): WysiwygEditor.Actions[T];
}
