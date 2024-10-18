import {Action, ExtensionBuilder} from '../../../../core';
import type {CommonAnswer} from '../ErrorScreen/types';
import {showGptWidget} from '../actions';
import {runGpt} from '../commands';
import {gptHotKeys} from '../constants';
import {gptWidgetPlugin} from '../plugin';

import type {GptWidgetDecoViewParams} from './view';

export const gptActionName = 'addGptWidget';

export type GptWidgetOptions<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> = Pick<
    GptWidgetDecoViewParams<AnswerData, PromptData>,
    | 'gptPopupContainer'
    | 'answerRender'
    | 'onApplyResult'
    | 'promptPresets'
    | 'customPromptPlaceholder'
    | 'disabledPromptPlaceholder'
    | 'onCustomPromptApply'
    | 'onPromptPresetClick'
    | 'onTryAgain'
    | 'onLike'
    | 'onDislike'
    | 'onClose'
    | 'onUpdate'
    | 'gptAlertProps'
>;

export const gptExtension = <
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
>(
    builder: ExtensionBuilder,
    options: GptWidgetOptions<AnswerData, PromptData>,
) => {
    builder.addAction(gptActionName, showGptWidget);
    builder.addPlugin(({serializer, markupParser}) => {
        return gptWidgetPlugin({
            ...options,
            serializer,
            parser: markupParser,
        });
    });
    builder.addKeymap(
        () => ({
            [gptHotKeys.openGptKey]: runGpt,
        }),
        builder.Priority.VeryLow,
    );
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [gptActionName]: Action<{}>;
        }
    }
}
