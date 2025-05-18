export class InputState {
    #shiftKey = false;

    get shiftKey() {
        return this.#shiftKey;
    }

    keydown(e: KeyboardEvent) {
        this.#shiftKey = e.code.startsWith('Shift') || e.shiftKey;
    }

    keyup(e: KeyboardEvent) {
        if (e.code.startsWith('Shift')) this.#shiftKey = false;
    }
}
