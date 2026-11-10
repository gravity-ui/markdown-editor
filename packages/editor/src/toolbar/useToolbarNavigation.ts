import {
    type FocusEvent,
    type KeyboardEvent,
    type RefObject,
    useCallback,
    useLayoutEffect,
    useRef,
} from 'react';

const getToolbarButtons = (toolbar: HTMLElement) =>
    [...toolbar.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].filter((button) => {
        const popup = button.closest(
            '[data-floating-ui-placement], [role="menu"], [role="listbox"], [role="dialog"]',
        );
        return button.getClientRects().length > 0 && (!popup || !toolbar.contains(popup));
    });

export function useToolbarNavigation(toolbarRef: RefObject<HTMLElement>, enabled = true) {
    const currentButtonRef = useRef<HTMLButtonElement>();

    const updateTabStop = useCallback(() => {
        const toolbar = toolbarRef.current;
        if (!enabled || !toolbar) return;

        const buttons = getToolbarButtons(toolbar);
        const currentButton =
            buttons.find((button) => button === currentButtonRef.current) ?? buttons[0];
        for (const button of buttons) {
            button.tabIndex = button === currentButton ? 0 : -1;
        }
    }, [enabled, toolbarRef]);

    useLayoutEffect(() => {
        const toolbar = toolbarRef.current;
        if (!enabled || !toolbar) return undefined;

        updateTabStop();
        const observer = new MutationObserver(updateTabStop);
        observer.observe(toolbar, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled'],
        });
        return () => observer.disconnect();
    }, [enabled, toolbarRef, updateTabStop]);

    const onFocus = (event: FocusEvent<HTMLElement>) => {
        if (
            event.target instanceof HTMLButtonElement &&
            getToolbarButtons(event.currentTarget).includes(event.target)
        ) {
            currentButtonRef.current = event.target;
            updateTabStop();
        }
    };
    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (
            event.defaultPrevented ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
        )
            return;
        if (!(event.target instanceof HTMLButtonElement)) return;
        if (event.target.getAttribute('aria-expanded') === 'true') return;

        const buttons = getToolbarButtons(event.currentTarget);
        const index = buttons.indexOf(event.target);
        if (index === -1) return;

        let nextIndex: number;
        switch (event.key) {
            case 'ArrowLeft':
                nextIndex = (index - 1 + buttons.length) % buttons.length;
                break;
            case 'ArrowRight':
                nextIndex = (index + 1) % buttons.length;
                break;
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = buttons.length - 1;
                break;
            default:
                return;
        }

        event.preventDefault();
        buttons[nextIndex].focus();
    };

    return {
        onFocus: enabled ? onFocus : undefined,
        onKeyDown: enabled ? onKeyDown : undefined,
    };
}
