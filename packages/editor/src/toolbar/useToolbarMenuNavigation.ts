import {type KeyboardEvent, useCallback, useLayoutEffect, useRef, useState} from 'react';

import {useLatest} from 'react-use';

type MenuEdge = 'first' | 'last';

const getMenuItems = (menu: HTMLElement) =>
    [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')].filter(
        (item) =>
            item.getAttribute('aria-disabled') !== 'true' && item.closest('[role="menu"]') === menu,
    );

const isMenuTabTarget = (menu: HTMLElement, target: HTMLElement) => {
    const popup = target.closest('[data-floating-ui-placement], [role="dialog"]');
    return (
        target.closest('[role="menu"]') === menu &&
        (!popup || !menu.contains(popup)) &&
        !target.matches('input, textarea, select, [contenteditable="true"]')
    );
};

export function useToolbarMenuNavigation({
    open,
    anchorElement,
    show,
    hide,
}: {
    open: boolean;
    anchorElement: HTMLElement | null;
    show: () => void;
    hide: () => void;
}) {
    const [menu, setMenu] = useState<HTMLUListElement | null>(null);
    const [returnFocus, setReturnFocus] = useState(true);
    const openRef = useLatest(open);
    const menuElementRef = useRef<HTMLUListElement | null>(null);
    const initialItem = useRef<HTMLElement | null>(null);
    const initialEdge = useRef<MenuEdge>('first');

    const prepareMenu = useCallback((element: HTMLUListElement) => {
        const items = getMenuItems(element);
        element.setAttribute('tabindex', '-1');
        element.removeAttribute('inert');
        initialItem.current = (initialEdge.current === 'last' ? items.at(-1) : items[0]) ?? element;
    }, []);

    const menuRef = useCallback(
        (element: HTMLUListElement | null) => {
            menuElementRef.current = element;
            if (element) prepareMenu(element);
            setMenu(element);
        },
        [prepareMenu],
    );

    const openMenu = (edge: MenuEdge = 'first') => {
        anchorElement?.focus();
        initialEdge.current = edge;
        setReturnFocus(true);
        if (menu) prepareMenu(menu);
        show();
    };

    const closeMenu = useCallback(() => {
        setReturnFocus(false);
        hide();
    }, [hide]);

    const onTransitionIn = useCallback(() => {
        const element = menuElementRef.current;
        if (!openRef.current || !element) return;

        const activeElement = element.ownerDocument.activeElement;
        if (activeElement !== anchorElement && activeElement !== element.ownerDocument.body) return;

        prepareMenu(element);
        initialItem.current?.focus();
    }, [anchorElement, openRef, prepareMenu]);

    const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

        event.preventDefault();
        openMenu(event.key === 'ArrowUp' ? 'last' : 'first');
    };

    useLayoutEffect(() => {
        if (!open || !menu) return undefined;

        const onKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
            const items = getMenuItems(menu);
            if (!(event.target instanceof HTMLElement)) return;

            if (event.key === 'Tab') {
                if (!isMenuTabTarget(menu, event.target)) return;

                event.stopPropagation();
                anchorElement?.focus();
                // Keep an exiting inline popup out of the browser's Tab order.
                menu.inert = true;
                closeMenu();
                return;
            }
            const index = items.indexOf(event.target);
            if (index === -1 && event.target !== menu) return;
            if (event.shiftKey || !items.length) return;

            if (index !== -1 && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                event.stopPropagation();
                event.target.click();
                return;
            }

            let nextIndex: number;
            switch (event.key) {
                case 'ArrowDown':
                    nextIndex = (index + 1) % items.length;
                    break;
                case 'ArrowUp':
                    nextIndex = (index - 1 + items.length) % items.length;
                    break;
                case 'Home':
                    nextIndex = 0;
                    break;
                case 'End':
                    nextIndex = items.length - 1;
                    break;
                default:
                    return;
            }
            event.preventDefault();
            event.stopPropagation();
            items[nextIndex].focus();
        };

        menu.addEventListener('keydown', onKeyDown);
        return () => menu.removeEventListener('keydown', onKeyDown);
    }, [anchorElement, closeMenu, menu, open]);

    return {
        initialFocus: -1,
        returnFocus,
        menuRef,
        closeMenu,
        onTransitionIn,
        onTriggerKeyDown,
        onTriggerClick: () => (open ? hide() : openMenu()),
    };
}
