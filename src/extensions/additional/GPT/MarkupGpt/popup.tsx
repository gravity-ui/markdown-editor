import {Popup} from '@gravity-ui/uikit';

import type {CommonAnswer} from '../ErrorScreen/types';
import {GptDialog, type GptDialogProps} from '../GptDialog/GptDialog';
import {gptPopupPlacement} from '../constants';
import {cnGptPopup} from '../gptExtension/view';

type Props<AnswerData extends CommonAnswer = CommonAnswer, PromptData extends unknown = unknown> = {
    onClose: () => void;
    markup: string;
    onConfirmOk?: () => void;
    onConfirmCancel?: () => void;
} & GptDialogProps<AnswerData, PromptData>;

export function renderPopup<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
>(anchor: HTMLElement, props: Props<AnswerData, PromptData>) {
    return (
        <Popup
            className={cnGptPopup()}
            open
            strategy="absolute"
            onOpenChange={(_open, _event, reason) => {
                if (reason === 'outside-press' || reason === 'escape-key') {
                    props.onClose();
                }
            }}
            anchorElement={anchor}
            placement={gptPopupPlacement}
        >
            <div className={cnGptPopup('content')}>
                <GptDialog
                    markup={props.markup}
                    answerRender={props.answerRender}
                    promptPresets={props.promptPresets}
                    disablePromptPresets={props.disablePromptPresets}
                    customPromptPlaceholder={props.customPromptPlaceholder}
                    disabledPromptPlaceholder={props.disabledPromptPlaceholder}
                    onApplyResult={props.onApplyResult}
                    onCustomPromptApply={props.onCustomPromptApply}
                    onPromptPresetClick={props.onPromptPresetClick}
                    onTryAgain={props.onTryAgain}
                    onLike={props.onLike}
                    onDislike={props.onDislike}
                    onClose={props.onClose}
                    onUpdate={props.onUpdate}
                    gptAlertProps={props.gptAlertProps}
                />
            </div>
        </Popup>
    );
}
