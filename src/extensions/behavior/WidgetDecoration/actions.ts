import {Transaction} from 'prosemirror-state';

import {widgetDecorationPluginKey} from './plugin';
import type {Meta} from './types';

export const removeDecoration = (tr: Transaction, id: string) => {
    const meta: Meta = {
        type: 'remove',
        id,
    };
    return tr.setMeta(widgetDecorationPluginKey, meta);
};
