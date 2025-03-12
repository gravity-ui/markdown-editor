import {useLayoutEffect, useMemo, useState} from 'react';

import {useLatest} from 'react-use';

import type {EditorView} from '#pm/view';
import type {SharedStateKey} from 'src/extensions/behavior/SharedState';

export function useSharedEditingState(view: EditorView, key: SharedStateKey<{editing: boolean}>) {
    const [value, setValue] = useState<Boolean>(false);
    const valueRef = useLatest(value);

    useLayoutEffect(() => {
        setValue(key.getValue(view.state)?.editing || false);
        return key.getNotifier(view.state).subscribe((data) => setValue(data?.editing || false));
    }, [key, view]);

    const {set, unset, toggle} = useMemo(() => {
        const dispatch = (value: boolean) => {
            view.dispatch(key.appendTransaction.update(view.state.tr, {editing: value}));
        };
        return {
            set: () => dispatch(true),
            unset: () => dispatch(false),
            toggle: () => dispatch(!valueRef.current),
        };
    }, [key, view, valueRef]);

    return [value, set, unset, toggle] as const;
}
