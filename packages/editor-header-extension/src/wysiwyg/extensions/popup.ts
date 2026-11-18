import type {KeyboardEvent} from 'react';

import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import type {PopupAnchorElement} from '@gravity-ui/uikit';

export const nodeAnchor = (element: HTMLElement): PopupAnchorElement => ({
    contextElement: element,
    getBoundingClientRect: () => element.getBoundingClientRect(),
});

type CloseAnchor = Element | null | undefined | (() => Element | null | undefined);

const closeUnlessAnchor =
    (anchor: CloseAnchor, onClose: (reason?: string) => void) =>
    (open: boolean, event?: Event, reason?: string) => {
        if (open) return;
        const element = typeof anchor === 'function' ? anchor() : anchor;
        const onAnchor =
            reason === 'outside-press' &&
            event?.target instanceof window.Node &&
            element?.contains(event.target);
        if (!onAnchor) onClose(reason);
    };

type DismissTarget = {
    anchor: () => Element | null;
    visible: () => boolean;
    hide: () => void;
};

export function popupDismiss(view: EditorView, {anchor, visible, hide}: DismissTarget) {
    let layer: HTMLElement | null = null;
    const inEditor = (target: EventTarget | null) =>
        target instanceof window.Node && view.dom.contains(target);
    const close = closeUnlessAnchor(anchor, (reason) => {
        hide();
        if (reason === 'escape-key') view.focus();
    });
    return {
        setLayer: (element: HTMLElement | null) => {
            layer = element;
        },
        onEscapeDown: () => {
            if (!visible()) return false;
            hide();
            return true;
        },
        onFocusOut: ({relatedTarget: target}: FocusEvent) => {
            if (!visible() || !(target instanceof window.Node)) return;
            if (!inEditor(target) && !layer?.contains(target)) hide();
        },
        onOpenChange: (open: boolean, event?: Event, reason?: string) => {
            const target = event instanceof FocusEvent ? event.relatedTarget : null;
            if (reason !== 'focus-out' || !inEditor(target)) close(open, event, reason);
        },
    };
}

export const focusableSelector = 'input:not([type="file"]), button, [tabindex="0"]';

const tabbable = (container: Element) =>
    Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) =>
            element.tabIndex >= 0 &&
            !element.matches(':disabled') &&
            element.checkVisibility?.() !== false,
    );

export const keepEnterInField = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    if (event.target instanceof HTMLInputElement) event.preventDefault();
};

export const closeOnTabOut = (
    event: KeyboardEvent<HTMLElement>,
    onClose: (reason?: string) => void,
) => {
    if (event.key !== 'Tab' || event.nativeEvent.defaultPrevented) return;
    const controls = tabbable(event.currentTarget);
    const edge = event.shiftKey ? controls[0] : controls[controls.length - 1];
    if (event.target !== edge) return;
    event.preventDefault();
    onClose('focus-out');
};
