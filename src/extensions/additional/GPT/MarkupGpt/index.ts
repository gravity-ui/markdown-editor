import {keymap} from '@codemirror/view';

import type {GptWidgetOptions} from '../../..';
import type {CommonAnswer} from '../ErrorScreen/types';
import {gptHotKeys} from '../constants';

import {runMarkupGpt} from './commands';
import {mGptPlugin} from './plugin';

export {mGptToolbarItem, getMGptToolbarItem} from './toolbar';
export {showMarkupGpt, hideMarkupGpt} from './commands';

export function mGptExtension<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
>(props: GptWidgetOptions<AnswerData, PromptData>) {
    const hotKey = props.hotKey ?? gptHotKeys.openGptKey;
    return [
        mGptPlugin(props).extension,
        keymap.of([
            {
                key: hotKey,
                run: runMarkupGpt,
            },
        ]),
    ];
}
