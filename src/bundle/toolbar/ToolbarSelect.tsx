import {
    HelpMark,
    Hotkey,
    Icon,
    Select,
    type SelectOption,
    type SelectProps,
} from '@gravity-ui/uikit';

import {cn} from '../../classname';
import {isFunction} from '../../lodash';

import type {WToolbarBaseProps, WToolbarItemData} from './types';

import './ToolbarSelect.scss';

const b = cn('toolbar-select');

export type ToolbarSelectProps = WToolbarBaseProps &
    Pick<SelectProps, 'disablePortal'> & {
        items: WToolbarItemData[];
    };

export const ToolbarSelect: React.FC<ToolbarSelectProps> = ({
    disablePortal,
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
                disablePortal={disablePortal}
                onOpenChange={focus}
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
                                        <HelpMark
                                            popoverProps={{modal: false}}
                                            className={b('item-hint')}
                                        >
                                            {hintText}
                                        </HelpMark>
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
