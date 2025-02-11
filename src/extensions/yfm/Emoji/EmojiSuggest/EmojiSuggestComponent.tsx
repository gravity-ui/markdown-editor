import {List, Popup, type PopupPlacement} from '@gravity-ui/uikit';

import {cn} from '../../../../classname';
import {ErrorLoggerBoundary} from '../../../../react-utils/ErrorBoundary';
import type {AutocompletePopupProps} from '../../../../utils/autocomplete-popup';

import type {EmojiDef} from './types';

import './EmojiSuggestComponent.scss';

const b = cn('emoji-suggest');
const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

const ITEM_HEIGHT = 28; // px
const VISIBLE_ITEMS_COUNT = 10;
const MAX_LIST_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS_COUNT; // px
function calcListHeight(itemsCount: number): number | undefined {
    if (itemsCount <= 0) return undefined;
    return Math.min(MAX_LIST_HEIGHT, itemsCount * ITEM_HEIGHT);
}

export type EmojiSuggestComponentProps = AutocompletePopupProps & {
    currentIndex?: number;
    items: readonly EmojiDef[];
    onClick(itemIndex: number): void;
};

export const EmojiSuggestComponent: React.FC<EmojiSuggestComponentProps> = ({
    anchorElement,
    currentIndex,
    items,
    onClick,
    onOpenChange,
}) => {
    if (!anchorElement) return null;

    return (
        <Popup
            open={Boolean(items.length)}
            anchorElement={anchorElement}
            placement={placement}
            onOpenChange={onOpenChange}
        >
            <div className={b()}>
                <List<EmojiDef>
                    virtualized
                    items={items as EmojiDef[]}
                    sortable={false}
                    filterable={false}
                    itemHeight={ITEM_HEIGHT}
                    itemsHeight={calcListHeight(items.length)}
                    renderItem={renderItem}
                    deactivateOnLeave={false}
                    activeItemIndex={currentIndex}
                    onItemClick={(_item, index) => onClick(index)}
                    className={b('list')}
                    itemClassName={b('list-item')}
                />
            </div>
        </Popup>
    );
};

function renderItem({origName, symbol, origShortcuts}: EmojiDef): React.ReactNode {
    return (
        <div key={origName} className={b('item')}>
            <div className={b('item-info')}>
                <div className={b('item-icon')}>{symbol}</div>
                <div className={b('item-name')}>:{origName}:</div>
            </div>
            {origShortcuts !== undefined && (
                <div className={b('item-shortcuts')}>
                    {origShortcuts.slice(0, 4).map((val) => (
                        <span key={`${origName}_${val}`} className={b('item-shortcut')}>
                            {val}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export function render(props: EmojiSuggestComponentProps): React.ReactNode {
    return (
        <ErrorLoggerBoundary>
            <EmojiSuggestComponent {...props} />
        </ErrorLoggerBoundary>
    );
}
