import {keymap} from '@codemirror/view';

import {GptWidgetOptions} from '../../..';
import {gptHotKeys} from '../constants';

import {runMarkupGpt} from './commands';
import {mGptPlugin} from './plugin';

export {mGptToolbarItem} from './toolbar';
export {showMarkupGpt, hideMarkupGpt} from './commands';

export function mGptExtension(props: GptWidgetOptions) {
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
