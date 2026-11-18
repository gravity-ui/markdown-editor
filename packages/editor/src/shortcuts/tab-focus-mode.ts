import type {TabFocusModeState} from '../utils/tab-focus-mode';

export function createTabFocusModeKeydownHandler(state: TabFocusModeState) {
    return (event: KeyboardEvent) => {
        if (event.defaultPrevented || event.isComposing) return;

        if (
            state.getMode() === 'focus' &&
            event.key === 'Tab' &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey
        ) {
            event.stopPropagation();
        }
    };
}
