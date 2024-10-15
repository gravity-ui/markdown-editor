import {useLayoutEffect, useMemo, useState} from 'react';
import type {RefObject} from 'react';

import debounceFn from 'lodash/debounce';

export type UseOverflowingContainerListItemsProps<ItemType extends unknown> = {
    containerRef: RefObject<HTMLElement>;
    items?: ItemType[];
    itemSelector: string;
    moreButtonSelector: string;
    marginBetweenItems?: number;
};

export function useOverflowingHorizontalItems<ItemType>({
    containerRef,
    items,
    itemSelector,
    moreButtonSelector,
    marginBetweenItems = 0,
}: UseOverflowingContainerListItemsProps<ItemType>) {
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [itemWidths, setItemWidths] = useState<number[]>([]);
    const [moreButtonWidth, setMoreButtonWidth] = useState<number>(0);

    useLayoutEffect(() => {
        const measureItemSizes = () => {
            const itemElements = Array.from(
                containerRef.current?.querySelectorAll(itemSelector) ?? [],
            );

            const moreButton = containerRef.current?.querySelector(moreButtonSelector);

            setItemWidths(itemElements.map((item) => item.clientWidth));

            if (moreButton) {
                setMoreButtonWidth(moreButton.clientWidth);
            }
        };

        requestAnimationFrame(measureItemSizes);
    }, [containerRef, itemSelector, moreButtonSelector]);

    useLayoutEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const updateContainerSize = (entries: ResizeObserverEntry[]) => {
            if (entries.length > 0) {
                setContainerWidth(entries[0]!.contentRect.width);
            }
        };

        const updateContainerSizeDebounced = debounceFn(updateContainerSize, 100);
        const containerResizeObserver = new ResizeObserver(updateContainerSizeDebounced);

        containerResizeObserver.observe(container);

        return () => containerResizeObserver.unobserve(container);
    }, [containerRef]);

    const isMeasured = itemWidths.length > 0;

    const {visibleItems, hiddenItems} = useMemo(() => {
        if (!isMeasured) {
            return {
                visibleItems: items ?? [],
                hiddenItems: [],
            };
        }

        const itemsCount = itemWidths.length;
        let visibleItemsCount = 0;

        const spaceForMoreButton = moreButtonWidth + marginBetweenItems;
        let remainingContainerWidth = containerWidth;

        for (const width of itemWidths) {
            const itemWidthWithMargin = width + marginBetweenItems;

            remainingContainerWidth -= itemWidthWithMargin;

            if (remainingContainerWidth < spaceForMoreButton) {
                const isMoreThanOneItemLeft = itemsCount !== visibleItemsCount + 1;
                const hasNoSpaceForTheLastItem = remainingContainerWidth < 0;

                if (isMoreThanOneItemLeft || hasNoSpaceForTheLastItem) {
                    break;
                }
            }

            visibleItemsCount++;
        }

        return {
            visibleItems: items?.slice(0, visibleItemsCount) ?? [],
            hiddenItems: items?.slice(visibleItemsCount) ?? [],
        };
    }, [containerWidth, isMeasured, itemWidths, items, marginBetweenItems, moreButtonWidth]);

    return {visibleItems, hiddenItems, measured: isMeasured};
}
