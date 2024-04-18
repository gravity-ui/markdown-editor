import type {ToolbarData} from './Toolbar';
import {ToolbarGroupData} from './ToolbarGroup';
import {ToolbarDataType, ToolbarGroupItemData, ToolbarItemData} from './types';

/** horizontal gap between item groups in toolbar, px */
const H_GAP = 17;
/** single button width, px */
const B_WIDTH = 28;
/** single button width with 2 icons – item's icon and arrow icon, px */
const B_WITH_ARROW_WIDTH = 42;
/** horizontal gap between buttons in button group, px */
const BG_H_GAP = 2;
/** dots button width, px */
const B_DOTS_WIDTH = B_WIDTH;
/** dots button left margin, px */
const B_DOTS_LEFT_GAP = 8;

const dotsWidth = B_DOTS_LEFT_GAP + B_DOTS_WIDTH;

export type ShrinkToolbarDataParams<E> = {
    data: ToolbarData<E>;
    availableWidth: number;
    hiddenActions?: ToolbarItemData<E>[];
};

export function shrinkToolbarData<E>({
    availableWidth,
    data,
    hiddenActions = [],
}: ShrinkToolbarDataParams<E>): {
    data: ToolbarData<E>;
    dots?: ToolbarItemData<E>[];
} {
    const fittingData: ToolbarData<E> = [];
    const dotsData: ToolbarItemData<E>[] = [];
    let currentWidth = 0;

    const lastGroupIndex = data.length - 1;
    const isLastElement = (i: number, j: number) =>
        i === lastGroupIndex && j === data[lastGroupIndex].length - 1;

    let hideAllNext = false;

    data.forEach((group, i) => {
        const newGroup: ToolbarGroupData<E> = [];
        group.forEach((item, j) => {
            currentWidth += getItemWidth(item, i, j, group.length);

            if (
                hideAllNext ||
                (!hiddenActions.length && isLastElement(i, j)
                    ? // Hide last element only if it doesn't fit
                      currentWidth > availableWidth
                    : // Hide other elements if they don't fit counting dots button width
                      currentWidth + dotsWidth > availableWidth)
            ) {
                // We found first button that doesn't fit. It means that everything after it doesn't fit too.
                hideAllNext = true;
                if (
                    item.type === ToolbarDataType.SingleButton ||
                    item.type === ToolbarDataType.ButtonPopup
                ) {
                    dotsData.push(item);
                } else if (item.type === ToolbarDataType.ListButton) {
                    dotsData.push(...item.data);
                }
            } else {
                newGroup.push(group[j]);
            }
        });

        if (newGroup.length) fittingData.push(newGroup);
    });

    dotsData.push(...hiddenActions);

    return {data: fittingData, dots: dotsData.length ? dotsData : undefined};
}

function getItemWidth<E>(
    item: ToolbarGroupItemData<E>,
    i: number,
    j: number,
    rowLength: number,
): number {
    let additionalWidth = 0;

    // Add horizontal gap between groups to the first item of all groups except first
    if (i > 0 && j === 0) additionalWidth += H_GAP;

    // Add horizontal gapbetween buttons to all items except first
    if (j > 0 && j < rowLength) additionalWidth += BG_H_GAP;

    if (item.type === ToolbarDataType.SingleButton || item.type === ToolbarDataType.ButtonPopup)
        return B_WIDTH + additionalWidth;
    else if (item.type === ToolbarDataType.ListButton) return B_WITH_ARROW_WIDTH + additionalWidth;
    else return (item.width || 0) + additionalWidth;
}
