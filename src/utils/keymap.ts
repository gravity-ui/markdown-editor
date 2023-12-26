import type {Command} from 'prosemirror-state';

import {logger} from '../logger';

export function withLogAction(action: string, command: Command): Command {
    return (...args) => {
        const res = command(...args);
        if (res) logger.action({action, source: 'keymap'});
        return res;
    };
}
