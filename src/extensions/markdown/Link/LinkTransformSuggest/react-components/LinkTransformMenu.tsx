import {HelpMark, Icon, List} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {isFunction} from 'src/lodash';

import type {SuggestItem} from '../types';

const b = cn('command-menu');
const ITEM_HEIGHT = 28; // px
const VISIBLE_ITEMS_COUNT = 10;
const MAX_LIST_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS_COUNT; // px
function calcListHeight(itemsCount: number): number | undefined {
    if (itemsCount <= 0) return undefined;
    return Math.min(MAX_LIST_HEIGHT, itemsCount * ITEM_HEIGHT);
}

export type LinkTransformMenuProps = {
    items: readonly SuggestItem[];
    currentIndex: number;
};

export const LinkTransformMenu: React.FC<LinkTransformMenuProps> = function LinkTransformMenu({
    items,
    currentIndex,
}) {
    return (
        <div className={b()}>
            <List<SuggestItem>
                virtualized
                items={items as SuggestItem[]}
                sortable={false}
                filterable={false}
                itemHeight={ITEM_HEIGHT}
                itemsHeight={calcListHeight(items.length)}
                renderItem={renderItem}
                deactivateOnLeave={false}
                activeItemIndex={currentIndex}
                // onItemClick={(_item, index) => onItemClick(index)} // TODO
                className={b('list')}
                itemClassName={b('list-item')}
            />
        </div>
    );
};

function renderItem({id, view: {title, icon, hint}}: SuggestItem): React.ReactNode {
    const titleText = isFunction(title) ? title() : title;
    const hintText = isFunction(hint) ? hint() : hint;

    return (
        <div key={id} className={b('item', {id})}>
            <Icon data={icon.data} size={20} className={b('item-icon')} />
            <div className={b('item-body')}>
                <span className={b('item-title')}>{titleText}</span>
                <div className={b('item-extra')}>
                    {hintText && <HelpMark className={b('item-hint')}>{hintText}</HelpMark>}
                </div>
            </div>
        </div>
    );
}
