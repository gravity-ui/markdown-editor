import {Fragment} from 'react';

import {cn} from '../classname';

import {ToolbarButtonGroup} from './ToolbarGroup';
import type {ToolbarBaseProps, ToolbarData} from './types';

import './Toolbar.scss';

const b = cn('toolbar');

export type {ToolbarData};

export type ToolbarProps<E> = ToolbarBaseProps<E> & {
    data: ToolbarData<E>;
};

export function Toolbar<E>({
    editor,
    data,
    className,
    focus,
    onClick,
    display,
    qa,
    disableHotkey,
    disablePreview,
    disableTooltip,
}: ToolbarProps<E>) {
    return (
        <div className={b({display}, [className])} data-qa={qa}>
            {data.map<React.ReactNode>((group, index) => {
                const isLastGroup = index === data.length - 1;

                return (
                    <Fragment key={index}>
                        <ToolbarButtonGroup
                            data={group}
                            editor={editor}
                            focus={focus}
                            onClick={onClick}
                            className={b('group')}
                            disableHotkey={disableHotkey}
                            disablePreview={disablePreview}
                            disableTooltip={disableTooltip}
                        />
                        {isLastGroup || <div className={b('group-separator')} />}
                    </Fragment>
                );
            })}
        </div>
    );
}
