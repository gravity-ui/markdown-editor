import {Popup} from '@gravity-ui/uikit';

import {cn} from 'src/classname';

import {type UseSearchProps, useSearch} from '../hooks/use-search';
import {SearchQA} from '../qa';
import type {SearchCounter} from '../types';

import {SearchCardView} from './SearchCardView';
import {SeachCompactView} from './SearchCompactView';

import './SearchPopup.scss';

const b = cn('search-popup');

export type SearchPopupProps = UseSearchProps & {
    open: boolean;
    anchor: Element;
    counter?: SearchCounter;
    onClose: () => void;
};

export const SearchPopup: React.FC<SearchPopupProps> = ({
    open,
    anchor,
    counter,
    onClose,
    ...props
}) => {
    const {isCompact, searchState, handlers} = useSearch(props);

    return (
        <Popup
            open={open}
            qa={SearchQA.Panel}
            anchorElement={anchor}
            placement="bottom-end"
            className={b({compact: isCompact})}
            onOpenChange={(_open, _event, reason) => {
                if (reason === 'escape-key') {
                    onClose();
                }
            }}
        >
            {isCompact ? (
                <SeachCompactView
                    counter={counter}
                    onClose={onClose}
                    value={searchState.search}
                    onExpand={handlers.onExpand}
                    onChange={handlers.onSearchChange}
                    onFindNext={handlers.onFindNext}
                    onFindPrevious={handlers.onFindPrevious}
                />
            ) : (
                <SearchCardView
                    counter={counter}
                    onClose={onClose}
                    searchState={searchState}
                    onSearchChange={handlers.onSearchChange}
                    onReplacementChange={handlers.onReplaceChange}
                    onFindNext={handlers.onFindNext}
                    onFindPrevious={handlers.onFindPrevious}
                    onReplace={handlers.onReplace}
                    onReplaceAll={handlers.onReplaceAll}
                    onWholeWordChange={handlers.onWholeWordChange}
                    onCaseSensitiveChange={handlers.onCaseSensitiveChange}
                />
            )}
        </Popup>
    );
};

SearchPopup.displayName = 'SearchPopup';

interface SearchPopupWithRefProps extends Omit<SearchPopupProps, 'anchor'> {
    anchor: Element | null;
}

export function renderSearchPopup({anchor, ...props}: SearchPopupWithRefProps) {
    if (!anchor) return null;

    return <SearchPopup anchor={anchor} {...props} />;
}
