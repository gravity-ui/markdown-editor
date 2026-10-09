import {useEffect, useReducer} from 'react';

import {useLatest} from 'react-use';

import {isEqual} from 'src/lodash';

import {useToolbarContext} from './context';
import type {ToolbarItemData} from './types';

export type UseActionStateReturn = {
    active: boolean;
    enabled: boolean;
};

export type ToolbarAction<E> = Pick<ToolbarItemData<E>, 'isActive' | 'isEnable'>;

function getActionsState<E>(editor: E, actions: ToolbarAction<E>[]): UseActionStateReturn[] {
    return actions.map(({isActive, isEnable}) => ({
        active: isActive(editor),
        enabled: isEnable(editor),
    }));
}

export function useActionState<E>(editor: E, action: ToolbarAction<E>): UseActionStateReturn {
    return useActionsState(editor, [action])[0];
}

export function useActionsState<E>(editor: E, actions: ToolbarAction<E>[]): UseActionStateReturn[] {
    const context = useToolbarContext();
    const eventBus = context?.eventBus;

    const [, rerender] = useReducer((count: number) => count + 1, 0);

    // Computed during render, so changed props never show the previous state.
    const state = getActionsState(editor, actions);
    const latestRef = useLatest({editor, actions, state});

    useEffect(() => {
        const onUpdate = () => {
            const latest = latestRef.current;
            if (!isEqual(latest.state, getActionsState(latest.editor, latest.actions))) {
                rerender();
            }
        };

        onUpdate();

        if (eventBus) {
            eventBus.on('update', onUpdate);
            return () => eventBus.off('update', onUpdate);
        }

        return undefined;
    }, [eventBus, latestRef]);

    return state;
}
