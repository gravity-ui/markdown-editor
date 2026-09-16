import {
    type ReactNode,
    createContext,
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import {Popup} from '@gravity-ui/uikit';
import {closeHistory} from 'prosemirror-history';

import type {Command} from '#pm/state';
import type {EditorView} from '#pm/view';

type Draft = {validate(): boolean; commit(): boolean; cancel(): void};
type CloseReason = 'submit' | 'outside' | 'cancel';
export type HeaderPopoverHandle = {close(reason: CloseReason): boolean};
const updating = new WeakSet<EditorView>();

/** ProseMirror must own the DOM selection while replacing a node's attributes. */
export function applyHeaderCommand(view: EditorView, command: Command) {
    const control = view.dom.ownerDocument.activeElement;
    updating.add(view);
    try {
        view.focus();
        command(view.state, (tr) => view.dispatch(closeHistory(tr)));
        if (control instanceof HTMLElement && control.isConnected)
            control.focus({preventScroll: true});
    } finally {
        updating.delete(view);
    }
}

const DraftContext = createContext<{register(draft: Draft): () => void; submit(): boolean} | null>(
    null,
);

export const HeaderPopover = forwardRef<
    HeaderPopoverHandle,
    {
        anchor: HTMLElement | null;
        title: string;
        editorView: EditorView;
        onClose(): void;
        children: ReactNode;
    }
>(function HeaderPopover({anchor, title, editorView, onClose, children}, ref) {
    const root = useRef<HTMLDivElement>(null);
    const drafts = useRef(new Set<Draft>());
    const closing = useRef(false);
    const register = useRef((draft: Draft) => {
        drafts.current.add(draft);
        return () => {
            drafts.current.delete(draft);
        };
    }).current;

    const close = (reason: CloseReason) => {
        if (closing.current) return false;
        if (reason === 'submit' && [...drafts.current].some((draft) => !draft.validate()))
            return false;
        closing.current = true;
        let valid = true;
        for (const draft of [...drafts.current]) {
            if (reason === 'cancel') draft.cancel();
            else if (!draft.commit()) valid = false;
        }
        if (!valid && reason === 'submit') {
            closing.current = false;
            return false;
        }
        onClose();
        if (reason === 'cancel') anchor?.focus();
        if (reason === 'submit') editorView.focus();
        return true;
    };
    useImperativeHandle(ref, () => ({close}));
    const isUndo = (target: EventTarget | null) =>
        target instanceof Element &&
        target.closest('[data-toolbar-item="undo"], [data-toolbar-item="redo"]');

    useEffect(() => {
        const document = editorView.dom.ownerDocument;
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target;
            if (
                target instanceof globalThis.Node &&
                !root.current?.contains(target) &&
                !anchor?.contains(target)
            )
                close(isUndo(target) ? 'cancel' : 'outside');
        };
        // Commit before ProseMirror moves the selection and unmounts the toolbar.
        document.addEventListener('pointerdown', onPointerDown, true);
        return () => document.removeEventListener('pointerdown', onPointerDown, true);
    });

    return (
        <Popup
            open
            disablePortal
            disableFocusOut
            returnFocus={false}
            initialFocus={0}
            anchorElement={anchor}
            placement={['bottom', 'top']}
            className="g-md-header-toolbar__popup"
            onOpenChange={(open, event, reason) => {
                if (open) return;
                const target = event?.target;
                if (target instanceof globalThis.Node && anchor?.contains(target)) return;
                close(reason === 'escape-key' || isUndo(target ?? null) ? 'cancel' : 'outside');
            }}
        >
            <DraftContext.Provider value={{register, submit: () => close('submit')}}>
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape closes the dialog from any of its controls. */}
                <div
                    ref={root}
                    role="dialog"
                    aria-label={title}
                    onMouseDown={(event) => {
                        // Clicking captions or padding must not focus the outer editor wrapper.
                        const control =
                            event.target instanceof Element
                                ? event.target.closest(
                                      'input, textarea, button, a, select, [tabindex]',
                                  )
                                : null;
                        if (!control || !event.currentTarget.contains(control))
                            event.preventDefault();
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            event.stopPropagation();
                            close('cancel');
                        }
                    }}
                    onBlur={(event) => {
                        const target = event.relatedTarget;
                        if (
                            updating.has(editorView) ||
                            !target ||
                            target === anchor ||
                            root.current?.contains(target)
                        )
                            return;
                        close(isUndo(target) ? 'cancel' : 'outside');
                    }}
                >
                    {children}
                </div>
            </DraftContext.Provider>
        </Popup>
    );
});

export function useUrlDraft(
    value: string,
    onCommit: (url: string) => void,
    normalize: (url: string) => string | null,
    disabled = false,
) {
    const context = useContext(DraftContext)!;
    const [state, setState] = useState({source: value, draft: value});
    const pending = useRef(state);
    pending.current = state;
    if (state.source !== value)
        setState({source: value, draft: state.draft === state.source ? value : state.draft});
    const current = useRef<Draft>({validate: () => true, commit: () => true, cancel: () => {}});
    current.current = {
        validate() {
            return (
                disabled ||
                pending.current.draft === pending.current.source ||
                !pending.current.draft.trim() ||
                normalize(pending.current.draft.trim()) !== null
            );
        },
        commit() {
            if (disabled || pending.current.draft === pending.current.source) return true;
            const trimmed = pending.current.draft.trim();
            const url = trimmed ? normalize(trimmed) : '';
            if (url === null) return false;
            pending.current = {source: url, draft: url};
            setState(pending.current);
            onCommit(url);
            return true;
        },
        cancel() {
            pending.current = {source: value, draft: value};
            setState(pending.current);
        },
    };
    const {register} = context;
    useLayoutEffect(
        () =>
            register({
                validate: () => current.current.validate(),
                commit: () => current.current.commit(),
                cancel: () => current.current.cancel(),
            }),
        [register],
    );
    return {
        value: state.draft,
        onUpdate: (draft: string) => {
            pending.current = {source: value, draft};
            setState(pending.current);
        },
        onSubmit: context.submit,
        reset: () => current.current.cancel(),
    };
}
