import type {AlertProps} from '@gravity-ui/uikit';

import type {CommonAnswer, GptRequestData, PromptPreset} from './ErrorScreen/types';

type ApplyResult = (markup: string) => void;

type GptAlertProps = {
    showedGptAlert: boolean;
    onCloseGptAlert?: () => void;
    message?: string;
    theme?: AlertProps['theme'];
    className?: string;
};

type GptSharedProps<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> = {
    answerRender: (data: AnswerData) => JSX.Element;
    promptPresets?: PromptPreset<PromptData>[];
    disablePromptPresets?: boolean;
    customPromptPlaceholder?: string;
    disabledPromptPlaceholder?: string;
    onCustomPromptApply?: (data: GptRequestData<PromptData>) => Promise<AnswerData | undefined>;
    onPromptPresetClick?: (data: GptRequestData<PromptData>) => Promise<AnswerData | undefined>;
    onTryAgain?: (data: GptRequestData<PromptData>) => Promise<AnswerData | undefined>;
    onLike?: (data: GptRequestData<PromptData>) => Promise<void>;
    onDislike?: (data: GptRequestData<PromptData>) => Promise<void>;
    onClose?: () => void;
    onUpdate?: (value: AnswerData | undefined) => void;
    gptAlertProps?: GptAlertProps;
};

export type GptDialogProps<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> = GptSharedProps<AnswerData, PromptData> & {
    markup: string;
    onApplyResult: ApplyResult;
};

export type GptWidgetOptions<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> = Omit<GptSharedProps<AnswerData, PromptData>, 'disablePromptPresets'> & {
    onApplyResult?: ApplyResult;
};

export type PresetListProps<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> = Pick<GptSharedProps<AnswerData, PromptData>, 'disablePromptPresets' | 'promptPresets'> & {
    onPresetClick: (data?: PromptData) => void;
};
