import React from 'react';

import {cn} from '../classname';

import {ToolbarButton} from './ToolbarButton';
import {ToolbarButtonPopup} from './ToolbarButtonPopup';
import {ToolbarListButton} from './ToolbarListButton';
import {ToolbarBaseProps, ToolbarDataType, ToolbarGroupData} from './types';

import './ToolbarGroup.scss';

const b = cn('toolbar-group');

export type ToolbarGroupProps<E> = ToolbarBaseProps<E> & {
    data: ToolbarGroupData<E>;
};

export function ToolbarButtonGroup<E>({
    className,
    editor,
    data,
    focus,
    onClick,
}: ToolbarGroupProps<E>) {
    return (
        <div className={b(null, [className])}>
            {data.map((item) => {
                if (item.type === ToolbarDataType.SingleButton) {
                    return (
                        <ToolbarButton
                            {...item}
                            key={item.id}
                            editor={editor}
                            focus={focus}
                            onClick={onClick}
                            className={b(item.type, {id: item.id}, [item.className])}
                        />
                    );
                }

                if (item.type === ToolbarDataType.ButtonPopup) {
                    return (
                        <ToolbarButtonPopup
                            {...item}
                            key={item.id}
                            editor={editor}
                            focus={focus}
                            onClick={onClick}
                            className={b(item.type, {id: item.id}, item.className)}
                        />
                    );
                }

                if (item.type === ToolbarDataType.ListButton) {
                    return (
                        <ToolbarListButton
                            {...item}
                            key={item.id}
                            editor={editor}
                            focus={focus}
                            onClick={onClick}
                            className={b(item.type, {id: item.id}, [item.className])}
                        />
                    );
                }

                if (item.type === ToolbarDataType.ReactComponent) {
                    const Component = item.component;
                    return (
                        <Component
                            key={item.id}
                            editor={editor}
                            focus={focus}
                            onClick={onClick}
                            className={b(item.type, {id: item.id}, [item.className])}
                        />
                    );
                }

                if (item.type === ToolbarDataType.ReactNode) {
                    return <React.Fragment key={item.id}>{item.content}</React.Fragment>;
                }

                if (item.type === ToolbarDataType.ReactNodeFn) {
                    return <React.Fragment key={item.id}>{item.content(editor)}</React.Fragment>;
                }

                return null;
            })}
        </div>
    );
}
