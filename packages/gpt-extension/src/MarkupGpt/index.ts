import {keymap} from '@codemirror/view';

import type {CommonAnswer} from '../ErrorScreen/types';
import {gptHotKeys} from '../constants';
import type {MarkupGptHost} from '../host';
import type {GptWidgetOptions} from '../types';

import {runMarkupGpt} from './commands';
import {mGptPlugin} from './plugin';

export {showMarkupGpt, hideMarkupGpt} from './commands';

export function mGptExtension<AnswerData extends CommonAnswer = CommonAnswer, PromptData = unknown>(
    props: GptWidgetOptions<AnswerData, PromptData>,
    host: MarkupGptHost,
) {
    return [
        mGptPlugin(props, host).extension,
        keymap.of([{key: gptHotKeys.openGptKey, run: runMarkupGpt}]),
    ];
}
