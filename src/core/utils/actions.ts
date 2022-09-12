import type {EditorView} from 'prosemirror-view';
import type {ActionSpec, Action} from '../types/actions';

export function bindActions<Keys extends string = string>(rawActions: Record<Keys, ActionSpec>) {
    return function (view: EditorView): Record<Keys, Action<Record<string, unknown>>> {
        return Object.entries<ActionSpec>(rawActions).reduce((acc, [key, spec]) => {
            acc[key as Keys] = {
                isActive: () => spec.isActive?.(view.state) ?? false,
                isEnable: (arg) => spec.isEnable(view.state, undefined, view, arg),
                run: (arg) => spec.run(view.state, view.dispatch, view, arg),
                meta: () => spec.meta?.(view.state),
            };

            return acc;
        }, {} as Record<Keys, Action<Record<string, unknown>>>);
    };
}
