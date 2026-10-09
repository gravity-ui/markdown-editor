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

function getActionState<E>(
    editor: E,
    {isActive, isEnable}: ToolbarAction<E>,
): UseActionStateReturn {
    return {active: isActive(editor), enabled: isEnable(editor)};
}

export function useActionState<E>(
    editor: E,
    {isActive, isEnable}: ToolbarAction<E>,
): UseActionStateReturn {
    const context = useToolbarContext();
    const eventBus = context?.eventBus;

    const [state, setState] = useState(() => getActionState(editor, {isActive, isEnable}));
    const stateRef = useLatest(state);

    useEffect(() => {
        const onUpdate = () => {
            const newState = getActionState(editor, {isActive, isEnable});
            if (!isEqual(stateRef.current, newState)) {
                setState(newState);
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

    const [state, setState] = useState(() =>
        actions.map((action) => getActionState(editor, action)),
    );
    const stateRef = useLatest(state);

    useEffect(() => {
        const onUpdate = () => {
            const newState = actions.map((action) => getActionState(editor, action));
            if (!isEqual(stateRef.current, newState)) {
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
        : actions.map((action) => getActionState(editor, action));
}
