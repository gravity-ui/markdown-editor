import React from 'react';

import {ActionTooltip, Button, DropdownMenu} from '@gravity-ui/uikit';

import {cn} from '../../../../classname';
import {i18n} from '../../../../i18n/gpt/dialog';
import {CommonAnswer, type PromptPreset} from '../ErrorScreen/types';
import type {GptDialogProps} from '../GptDialog/GptDialog';
import {gptHotKeys} from '../constants';
import {useGptHotKeys} from '../hooks/useGptHotKeys';
import {usePresetList} from '../hooks/usePresetList';

import './Presetlist.scss';

export type PresetListProps<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> = {
    disablePromptPresets: GptDialogProps<AnswerData, PromptData>['disablePromptPresets'];
    promptPresets: GptDialogProps<AnswerData, PromptData>['promptPresets'];
    onPresetClick: (data?: PromptData) => void;
};

type PresetItemType<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> = {
    preset: PromptPreset<PromptData>;
    onPresetClick: PresetListProps<AnswerData, PromptData>['onPresetClick'];
    disablePromptPresets?: PresetListProps['disablePromptPresets'];
    hotKey: string;
};

export const cnGptDialogPresetList = cn('gpt-dialog-preset-list');

const PresetItem = <
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
>({
    preset,
    onPresetClick,
    disablePromptPresets,
    hotKey,
}: PresetItemType<AnswerData, PromptData>) => {
    useGptHotKeys(
        hotKey,
        () => {
            onPresetClick(preset.data);
        },
        {enableOnFormTags: true, enableOnContentEditable: true},
    );

    return (
        <ActionTooltip title={preset.display} hotkey={hotKey}>
            <Button
                className={cnGptDialogPresetList('preset')}
                view="normal"
                size="m"
                disabled={disablePromptPresets}
                onClick={() => onPresetClick(preset.data)}
            >
                {preset.display}
            </Button>
        </ActionTooltip>
    );
};

export const PresetList = <
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
>({
    disablePromptPresets,
    promptPresets,
    onPresetClick,
}: PresetListProps<AnswerData, PromptData>) => {
    const {presetsContainerRef, visiblePresets, hiddenPresets, showMoreButton, measured} =
        usePresetList<AnswerData, PromptData>({
            promptPresets,
            onPresetClick,
        });

    return (
        <div className={cnGptDialogPresetList({measured})} ref={presetsContainerRef}>
            {visiblePresets.map((preset, index) => (
                <PresetItem
                    preset={preset}
                    key={preset.display}
                    hotKey={preset.hotKey || gptHotKeys.presetsKey(String(index + 1))}
                    disablePromptPresets={disablePromptPresets}
                    onPresetClick={onPresetClick}
                />
            ))}
            {showMoreButton && (
                <DropdownMenu
                    switcherWrapperClassName={cnGptDialogPresetList('more-button-wrapper')}
                    switcher={
                        <Button
                            className={cnGptDialogPresetList('more-button')}
                            view="normal"
                            size="m"
                        >
                            {i18n('more')}
                        </Button>
                    }
                    items={hiddenPresets}
                />
            )}
        </div>
    );
};
