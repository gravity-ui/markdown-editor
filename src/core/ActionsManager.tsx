import type {ActionStorage} from './types/actions';

export class ActionsManager implements ActionStorage {
    #actions: YfmEditor.Actions;

    get actions() {
        return this.#actions;
    }

    constructor(actions?: YfmEditor.Actions) {
        this.#actions = actions ?? ({} as YfmEditor.Actions);
    }

    action<T extends keyof YfmEditor.Actions>(actionName: T): YfmEditor.Actions[T] {
        return this.#actions[actionName];
    }

    setActions(actions: YfmEditor.Actions) {
        this.#actions = actions;
        return this;
    }
}
