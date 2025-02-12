import {Fragment} from 'react';

import {cn} from '../classname';

import {ToolbarButton} from './ToolbarButton';
import {ToolbarButtonPopup} from './ToolbarButtonPopup';
import {ToolbarListButton} from './ToolbarListButton';
import {type ToolbarBaseProps, ToolbarDataType, type ToolbarGroupData} from './types';

import './ToolbarGroup.scss';

const b = cn('toolbar-group');

export type {ToolbarGroupData};

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
                            {...item.props}
                            key={item.id}
                            editor={editor}
                            focus={focus}
                            onClick={onClick}
                            className={b(item.type, {id: item.id}, [item.className])}
                        />
                    );
                }

                if (item.type === ToolbarDataType.ReactNode) {
                    return <Fragment key={item.id}>{item.content}</Fragment>;
                }

                if (item.type === ToolbarDataType.ReactNodeFn) {
                    return <Fragment key={item.id}>{item.content(editor)}</Fragment>;
                }

                return null;
            })}
        </div>
    );
}
