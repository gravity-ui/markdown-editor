import type {Command} from 'prosemirror-state';

import {getLoggerFromState} from '../core';
import {globalLogger} from '../logger';

export function withLogAction(action: string, command: Command): Command {
    return (...args) => {
        const res = command(...args);
        if (res) {
            const [state] = args;
            const logger = getLoggerFromState(state);
            logger.action({action, source: 'keymap'});
            globalLogger.action({action, source: 'keymap', mode: 'wysiwyg'});
        }
        return res;
    };
}
