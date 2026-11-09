import {useEffect, useLayoutEffect, useRef, useState} from 'react';

import {Popup} from '@gravity-ui/uikit';

import {cn} from 'src/classname';

import {type UseSearchProps, useSearch} from '../hooks/use-search';
import {SearchQA} from '../qa';
import type {SearchCounter} from '../types';

import {SearchCardView} from './SearchCardView';
import {SeachCompactView} from './SearchCompactView';
import {
    type UseObserveIntersectionProps,
    useObserveIntersection,
} from './hooks/useObserveIntersection';

import './SearchPopup.scss';

const b = cn('search-popup');

export type SearchPopupProps = UseSearchProps & {
    open: boolean;
    anchor: Element;
    counter?: SearchCounter;
    onClose: () => void;
    intersectionTracking: Pick<
        UseObserveIntersectionProps,
        'container' | 'selector' | 'observerOptions'
    >;
};

export const SearchPopup: React.FC<SearchPopupProps> = ({
    open,
    anchor,
    counter,
    onClose,
    intersectionTracking,
    ...props
}) => {
    const {isCompact, searchState, handlers} = useSearch(props);
    const [popupOpen, setPopupOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const floatingRef = useRef<HTMLDivElement>(null);
    const {intersection} = useObserveIntersection({
        floatingRef,
        container: intersectionTracking.container,
        selector: intersectionTracking.selector,
        observerOptions: intersectionTracking.observerOptions,
    });

    useEffect(() => {
        // TODO(next major): Require UIKit >= 7.39.0 and remove delayed opening.
        // UIKit 7.13 needs its anchor registered before the popup opens.
        setPopupOpen(open);
    }, [open]);

    useLayoutEffect(() => {
        // The full form replaces the input while Popup stays open.
        if (!isCompact) inputRef.current?.focus({preventScroll: true});
    }, [isCompact]);

    return (
        <Popup
            open={popupOpen}
            initialFocus={inputRef}
            qa={SearchQA.Panel}
            anchorElement={anchor}
            // Fixed positioning prevents page scroll when search opens or expands.
            // Keep it after the UIKit upgrade; removing it needs a separate fix and scroll checks.
            strategy="fixed"
            placement="bottom-end"
            floatingRef={floatingRef}
            floatingStyles={{opacity: intersection ? 0.8 : 1}}
            className={b({compact: isCompact})}
            onOpenChange={(_open, _event, reason) => {
                if (reason === 'escape-key') {
                    onClose();
                }
            }}
        >
            {isCompact ? (
                <SeachCompactView
                    inputRef={inputRef}
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
                    inputRef={inputRef}
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
