import {useMemo, useRef} from 'react';

import type {DropdownMenuItem} from '@gravity-ui/uikit';

import type {GptDialogProps} from '../GptDialog/GptDialog';
import type {PresetListProps} from '../PresetList/PresetList';
import {cnGptDialogPresetList} from '../PresetList/PresetList';

import {useOverflowingHorizontalItems} from './useOverflowingHorizontalItems';

type UsePresetListProps = Pick<GptDialogProps, 'promptPresets'> & {
    onPresetClick: PresetListProps['onPresetClick'];
};

export const usePresetList = ({promptPresets, onPresetClick}: UsePresetListProps) => {
    const presetsContainerRef = useRef<HTMLDivElement>(null);

    const {visibleItems, hiddenItems, measured} = useOverflowingHorizontalItems({
        containerRef: presetsContainerRef,
        items: promptPresets,
        itemSelector: `.${cnGptDialogPresetList('preset')}`,
        moreButtonSelector: `.${cnGptDialogPresetList('more-button-wrapper')}`,
        marginBetweenItems: 8,
    });

    const hiddenPresets: DropdownMenuItem[] = useMemo(() => {
        const items: DropdownMenuItem[] = [];

        for (const item of hiddenItems) {
            items.push({
                text: item.display,
                action: () => onPresetClick(item.data),
                items: [],
            });
        }

        return items;
    }, [onPresetClick, hiddenItems]);

    const showMoreButton = !measured || hiddenPresets.length > 0;

    return {
        measured,
        showMoreButton,
        presetsContainerRef,
        visiblePresets: visibleItems,
        hiddenPresets,
    };
};
