import {useEffect, useState} from 'react';

import {useLatest} from 'react-use';

import {isEqual} from 'src/lodash';

import {useToolbarContext} from './context';
import type {ToolbarItemData} from './types';

export type UseActionStateReturn = {
    active: boolean;
    enabled: boolean;
};

export type ToolbarAction<E> = Pick<ToolbarItemData<E>, 'isActive' | 'isEnable'>;

export function useActionState<E>(
    editor: E,
    {isActive, isEnable}: ToolbarAction<E>,
): UseActionStateReturn {
    const context = useToolbarContext();
    const eventBus = context?.eventBus;

    const [state, setState] = useState<UseActionStateReturn>({
        active: false,
        enabled: true,
    });
    const stateRef = useLatest(state);

    useEffect(() => {
        const onUpdate = () => {
            const newActive = isActive(editor);
            const newEnabled = isEnable(editor);

            const {active, enabled} = stateRef.current;
            if (active !== newActive || enabled !== newEnabled) {
                setState({
                    active: newActive,
                    enabled: newEnabled,
                });
            }
        };

        onUpdate();

        if (eventBus) {
            eventBus.on('update', onUpdate);
            return () => eventBus.off('update', onUpdate);
        }

        return undefined;
    }, [editor, isActive, isEnable, eventBus, stateRef]);

    return state;
}

export function useActionsState<E>(editor: E, actions: ToolbarAction<E>[]): UseActionStateReturn[] {
    const context = useToolbarContext();
    const eventBus = context?.eventBus;

    const [state, setState] = useState<UseActionStateReturn[]>(() =>
        actions.map(() => ({
            active: false,
            enabled: true,
        })),
    );
    const stateRef = useLatest(state);

    useEffect(() => {
        const onUpdate = () => {
            const currentState = stateRef.current;
            const newState = actions.map(({isActive, isEnable}) => ({
                active: isActive(editor),
                enabled: isEnable(editor),
            }));
            if (!isEqual(currentState, newState)) {
                setState(newState);
            }
        };

        onUpdate();

        if (eventBus) {
            eventBus.on('update', onUpdate);
            return () => eventBus.off('update', onUpdate);
        }

        return undefined;
    }, [actions, editor, eventBus, stateRef]);

    return state.length === actions.length
        ? state
        : actions.map(() => ({active: false, enabled: true}));
}
