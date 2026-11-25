import {EventEmitter} from './event-emitter';

export type TabFocusMode = 'focus' | 'indent';

type TabFocusModeEventMap = {
    change: {mode: TabFocusMode};
};

export class TabFocusModeState extends EventEmitter<TabFocusModeEventMap> {
    #mode: TabFocusMode;

    constructor(initialMode: TabFocusMode = 'indent') {
        super();
        this.#mode = initialMode;
    }

    getMode(): TabFocusMode {
        return this.#mode;
    }

    setMode(mode: TabFocusMode): void {
        if (this.#mode === mode) return;
        this.#mode = mode;
        this.emit('change', {mode});
    }

    toggle(): void {
        this.setMode(this.#mode === 'focus' ? 'indent' : 'focus');
    }
}
