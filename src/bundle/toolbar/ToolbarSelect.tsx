import React from 'react';

import {HelpMark, Hotkey, Icon, Select, type SelectOption} from '@gravity-ui/uikit';

import {cn} from '../../classname';
import {ActionStorage} from '../../core';
import {isFunction} from '../../lodash';
import {ToolbarBaseProps} from '../../toolbar';
import type {WToolbarItemData} from '../config/wysiwyg';

import './ToolbarSelect.scss';

const b = cn('toolbar-select');

export type ToolbarSelectProps = ToolbarBaseProps<ActionStorage> & {
    items: WToolbarItemData[];
};

export const ToolbarSelect: React.FC<ToolbarSelectProps> = ({
    className,
    editor,
    focus,
    onClick,
    items,
}) => {
    const activeItem = items.find((item) => item.isActive(editor));

    return (
        <>
            <Select
                size="m"
                view="clear"
                className={className}
                onOpenChange={() => {
                    focus();
                }}
                value={activeItem ? [activeItem.id] : undefined}
                options={items.map<SelectOption>((item) => ({
                    data: item,
                    value: item.id,
                    text: isFunction(item.title) ? item.title() : item.title,
                }))}
                renderOption={({text, data}) => {
                    const {icon, hotkey, hint} = data as WToolbarItemData;
                    const hintText = isFunction(hint) ? hint() : hint;
                    return (
                        <div aria-label={text} className={b('item')}>
                            <div className={b('item-icon')}>
                                <Icon data={icon.data} size={Number(icon.size ?? 16) + 2} />
                            </div>
                            <div className={b('item-content')}>
                                {text}
                                <div className={b('item-extra')}>
                                    {hotkey && <Hotkey value={hotkey} />}
                                    {hintText && (
                                        <HelpMark className={b('item-hint')}>{hintText}</HelpMark>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }}
                onUpdate={([id]) => {
                    items.find((item) => item.id === id)?.exec(editor);
                    onClick?.(id);
                    focus();
                }}
            />
        </>
    );
};
