import React from 'react';

import {List, Popup, PopupPlacement} from '@gravity-ui/uikit';

import {cn} from '../../../../classname';
import {i18n} from '../../../../i18n/suggest';
import {ErrorLoggerBoundary} from '../../../../react-utils/ErrorBoundary';
import {AutocompletePopupProps} from '../../../../utils/autocomplete-popup';

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
    anchor,
    currentIndex,
    items,
    onClick,
    onEnterKeyDown,
    onEscapeKeyDown,
    onOutsideClick,
}) => {
    if (!anchor) return null;

    return (
        <Popup
            open
            anchorRef={{current: anchor}}
            placement={placement}
            onEnterKeyDown={onEnterKeyDown}
            onEscapeKeyDown={onEscapeKeyDown}
            onOutsideClick={onOutsideClick}
        >
            <div className={b()}>
                <List<EmojiDef>
                    virtualized
                    items={items as EmojiDef[]}
                    sortable={false}
                    filterable={false}
                    emptyPlaceholder={i18n('empty-msg')}
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
