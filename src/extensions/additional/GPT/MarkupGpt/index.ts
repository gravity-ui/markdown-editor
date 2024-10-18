import {keymap} from '@codemirror/view';

import {GptWidgetOptions} from '../../..';
import {CommonAnswer} from '../ErrorScreen/types';
import {gptHotKeys} from '../constants';

import {runMarkupGpt} from './commands';
import {mGptPlugin} from './plugin';

export {mGptToolbarItem} from './toolbar';
export {showMarkupGpt, hideMarkupGpt} from './commands';

export function mGptExtension<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
>(props: GptWidgetOptions<AnswerData, PromptData>) {
    return [
        mGptPlugin(props).extension,
        keymap.of([
            {
                key: gptHotKeys.openGptKey,
                run: runMarkupGpt,
            },
        ]),
    ];
}
