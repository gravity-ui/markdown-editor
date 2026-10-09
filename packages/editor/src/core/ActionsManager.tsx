import type {ActionStorage} from './types/actions';

export class ActionsManager implements ActionStorage {
    #actions: WysiwygEditor.Actions;

    get actions() {
        return this.#actions;
    }

    constructor(actions?: WysiwygEditor.Actions) {
        this.#actions = actions ?? ({} as WysiwygEditor.Actions);
    }

    action<T extends keyof WysiwygEditor.Actions>(actionName: T): WysiwygEditor.Actions[T] {
        return this.#actions[actionName];
    }

    setActions(actions: WysiwygEditor.Actions) {
        this.#actions = actions;
        return this;
    }
}
