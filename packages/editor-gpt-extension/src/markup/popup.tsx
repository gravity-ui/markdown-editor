import {GptPopup} from '../components/GptPopup/GptPopup';
import type {CommonAnswer, GptDialogProps} from '../types';

type Props<AnswerData extends CommonAnswer = CommonAnswer, PromptData extends unknown = unknown> = {
    sessionKey?: number;
    onClose: () => void;
    markup: string;
    onConfirmOk?: () => void;
    onConfirmCancel?: () => void;
} & GptDialogProps<AnswerData, PromptData>;

export function renderPopup<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
>(anchor: HTMLElement, props: Props<AnswerData, PromptData>) {
    return <GptPopup key={props.sessionKey} {...props} anchorElement={anchor} />;
}
