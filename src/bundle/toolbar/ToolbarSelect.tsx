import React from 'react';

import {HelpPopover} from '@gravity-ui/components';
import {Hotkey, Icon, Select, SelectOption} from '@gravity-ui/uikit';

import {cn} from '../../classname';
import type {ActionStorage} from '../../core';
import {isFunction} from '../../lodash';
import {PreviewTooltip} from '../../toolbar/PreviewTooltip';

import type {ToolbarBaseProps, WToolbarItemData} from './types';

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
                    const {icon, hotkey, hint, preview} = data as WToolbarItemData;
                    const hintText = isFunction(hint) ? hint() : hint;
                    return (
                        <PreviewTooltip preview={preview}>
                            <div aria-label={text} className={b('item')}>
                                <div className={b('item-icon')}>
                                    <Icon data={icon.data} size={Number(icon.size ?? 16) + 2} />
                                </div>
                                <div className={b('item-content')}>
                                    {text}
                                    <div className={b('item-extra')}>
                                        {hotkey && <Hotkey value={hotkey} />}
                                        {hintText && (
                                            <HelpPopover
                                                content={hintText}
                                                className={b('item-hint')}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </PreviewTooltip>
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
