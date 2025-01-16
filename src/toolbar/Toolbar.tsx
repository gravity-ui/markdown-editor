import React from 'react';

import {cn} from '../classname';

import {ToolbarButtonGroup} from './ToolbarGroup';
import {ToolbarProps} from './types';

import './Toolbar.scss';

const b = cn('toolbar');

export function Toolbar<E>({editor, data, className, focus, onClick}: ToolbarProps<E>) {
    return (
        <div className={b(null, [className])}>
            {data.map<React.ReactNode>((group, index) => {
                const isLastGroup = index === data.length - 1;

                return (
                    <React.Fragment key={index}>
                        <ToolbarButtonGroup
                            data={group}
                            editor={editor}
                            focus={focus}
                            onClick={onClick}
                            className={b('group')}
                        />
                        {isLastGroup || <div className={b('group-separator')} />}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
