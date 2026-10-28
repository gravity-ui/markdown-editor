import type {CommonAnswer} from '../ErrorScreen/types';
import {GptPopup} from '../GptPopup/GptPopup';
import type {GptDialogProps} from '../types';

export function renderPopup<AnswerData extends CommonAnswer, PromptData>(
    anchor: HTMLElement,
    props: GptDialogProps<AnswerData, PromptData>,
) {
    return <GptPopup anchorElement={anchor} {...props} />;
}
