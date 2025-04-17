import {HelpMark, Hotkey, Icon, List, Popup, type PopupPlacement} from '@gravity-ui/uikit';

import {cn} from '../../../classname';
import {i18n} from '../../../i18n/suggest';
import {isFunction} from '../../../lodash';
import {ErrorLoggerBoundary} from '../../../react-utils/ErrorBoundary';
import {PreviewTooltip} from '../../../toolbar/PreviewTooltip';
import type {AutocompletePopupProps} from '../../../utils/autocomplete-popup';

import type {CommandAction} from './types';

import './component.scss';

const b = cn('command-menu');
const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

const ITEM_HEIGHT = 28; // px
const VISIBLE_ITEMS_COUNT = 10;
const MAX_LIST_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS_COUNT; // px
function calcListHeight(itemsCount: number): number | undefined {
    if (itemsCount <= 0) return undefined;
    return Math.min(MAX_LIST_HEIGHT, itemsCount * ITEM_HEIGHT);
}

export type CommandMenuItem = Pick<
    CommandAction,
    'id' | 'title' | 'icon' | 'hotkey' | 'hint' | 'preview'
>;

export type CommandMenuComponentProps = AutocompletePopupProps & {
    currentIndex?: number;
    items: readonly CommandMenuItem[];
    onItemClick(itemIndex: number): void;
};

export const CommandMenuComponent: React.FC<CommandMenuComponentProps> = ({
    anchorElement,
    currentIndex,
    items,
    onItemClick,
    onOpenChange,
}) => {
    if (!anchorElement) return null;

    return (
        <Popup
            open
            anchorElement={anchorElement}
            placement={placement}
            onOpenChange={onOpenChange}
            qa="g-md-command-menu"
        >
            <div className={b()}>
                <List<CommandMenuItem>
                    virtualized
                    items={items as CommandMenuItem[]}
                    sortable={false}
                    filterable={false}
                    emptyPlaceholder={i18n('empty-msg')}
                    itemHeight={ITEM_HEIGHT}
                    itemsHeight={calcListHeight(items.length)}
                    renderItem={renderItem}
                    deactivateOnLeave={false}
                    activeItemIndex={currentIndex}
                    onItemClick={(_item, index) => onItemClick(index)}
                    className={b('list')}
                    itemClassName={b('list-item')}
                />
            </div>
        </Popup>
    );
};

function renderItem({id, title, icon, hotkey, hint, preview}: CommandMenuItem): React.ReactNode {
    const titleText = isFunction(title) ? title() : title;
    const hintText = isFunction(hint) ? hint() : hint;

    return (
        <PreviewTooltip preview={preview}>
            <div key={id} className={b('item', {id})}>
                <Icon data={icon.data} size={20} className={b('item-icon')} />
                <div className={b('item-body')}>
                    <span className={b('item-title')}>{titleText}</span>
                    <div className={b('item-extra')}>
                        {hotkey && <Hotkey value={hotkey} className={b('item-hotkey')} />}
                        {hintText && <HelpMark className={b('item-hint')}>{hintText}</HelpMark>}
                    </div>
                </div>
            </div>
        </PreviewTooltip>
    );
}

export function render(props: CommandMenuComponentProps): React.ReactNode {
    return (
        <ErrorLoggerBoundary>
            <CommandMenuComponent {...props} />
        </ErrorLoggerBoundary>
    );
}
