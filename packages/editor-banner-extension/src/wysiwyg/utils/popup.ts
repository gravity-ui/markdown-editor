import type {KeyboardEvent} from 'react';

import type {PopupAnchorElement} from '@gravity-ui/uikit';

/** A virtual anchor: Floating UI puts no focus guards next to the editor DOM. */
export const nodeAnchor = (element: HTMLElement): PopupAnchorElement => ({
    contextElement: element,
    getBoundingClientRect: () => element.getBoundingClientRect(),
});

export type CloseAnchor = Element | null | undefined;

export const closeUnlessAnchor =
    (anchor: CloseAnchor, onClose: (reason?: string) => void) =>
    (open: boolean, event?: Event, reason?: string) => {
        if (open) return;
        const onAnchor =
            reason === 'outside-press' &&
            event?.target instanceof window.Node &&
            anchor?.contains(event.target);
        if (!onAnchor) onClose(reason);
    };

export const focusableSelector = 'input:not([type="file"]), button, [tabindex="0"]';

const tabbable = (container: Element) =>
    Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) =>
            element.tabIndex >= 0 &&
            !element.matches(':disabled') &&
            element.checkVisibility?.() !== false,
    );

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
