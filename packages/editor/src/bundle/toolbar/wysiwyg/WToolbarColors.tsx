import {useEffect, useState} from 'react';

import {useLatest} from 'react-use';

import type {ActionStorage} from '#core';
import {isEqual} from 'src/lodash';
import {useToolbarContext} from 'src/toolbar/context';

import {ToolbarColors, type ToolbarColorsProps} from '../custom/ToolbarColors';
import type {WToolbarBaseProps} from '../types';

export type WToolbarColorsProps = WToolbarBaseProps & Pick<ToolbarColorsProps, 'disablePortal'>;

export const WToolbarColors: React.FC<WToolbarColorsProps> = ({
    disablePortal,
    className,
    editor,
    focus,
    onClick,
}) => {
    const {active, enabled, currentColor} = useColorsState(editor);
    const action = editor.actions.colorify;

    return (
        <ToolbarColors
            active={active}
            enable={enabled}
            currentColor={currentColor}
            exec={(color) => {
                action.run({color});
            }}
            disablePortal={disablePortal}
            className={className}
            focus={focus}
            onClick={onClick}
            withDefault
        />
    );
};

type ColorsState = {
    active: boolean;
    enabled: boolean;
    currentColor: string;
};

function useColorsState(editor: ActionStorage): ColorsState {
    const action = editor.actions.colorify;

    const context = useToolbarContext();

    const [state, setState] = useState<ColorsState>({
        active: false,
        enabled: true,
        currentColor: '',
    });
    const stateRef = useLatest(state);

    useEffect(() => {
        if (!context) return undefined;

        const onUpdate = () => {
            const newState = {
                active: action.isActive(),
                enabled: action.isEnable(),
                currentColor: action.meta(),
            };

            if (!isEqual(stateRef.current, newState)) {
                setState(newState);
            }
        };

        onUpdate();

        context.eventBus.on('update', onUpdate);

        return () => {
            context.eventBus.off('update', onUpdate);
        };
    }, [action, context, stateRef]);

    return state;
}
