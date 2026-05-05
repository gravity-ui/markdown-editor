import type {Action, ExtensionBuilder} from '../../../../core';
import type {CommonAnswer} from '../ErrorScreen/types';
import {showGptWidget} from '../actions';
import {runGpt} from '../commands';
import {gptHotKeys} from '../constants';
import {gptWidgetPlugin} from '../plugin';
import type {GptWidgetOptions} from '../types';

export type {GptWidgetOptions};
export const gptActionName = 'addGptWidget';

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
