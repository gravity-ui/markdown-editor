import {keymap} from '@codemirror/view';

import type {CommonAnswer} from '../components/ErrorScreen/types';
import {gptHotKeys} from '../constants';
import type {MarkupGptHost} from '../host';
import type {GptWidgetOptions} from '../types';

import {runMarkupGpt} from './commands/gpt';
import {mGptPlugin} from './plugin';

export {showMarkupGpt, hideMarkupGpt} from './commands/gpt';

export function mGptExtension<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
>(props: GptWidgetOptions<AnswerData, PromptData>, host: MarkupGptHost) {
    return [
        mGptPlugin(props, host).extension,
        keymap.of([
            {
                key: gptHotKeys.openGptKey,
                run: runMarkupGpt,
            },
        ]),
    ];
}
