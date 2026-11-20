import type {KeyboardEvent} from 'react';

const focusableSelector = 'input:not([type="file"]), button, [tabindex="0"]';

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
