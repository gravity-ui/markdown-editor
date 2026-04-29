import type {Transaction} from 'prosemirror-state';

import type {Meta} from './meta';
import {widgetDecorationPluginKey} from './plugin-key';

export const removeDecoration = (tr: Transaction, id: string) =>
    tr.setMeta(widgetDecorationPluginKey, {type: 'remove', id} satisfies Meta);
