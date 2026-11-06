import {SquareDashed} from '@gravity-ui/icons';
import {
    ToolbarDataType,
    type ToolbarItemMarkup,
    type ToolbarItemView,
    type ToolbarItemWysiwyg,
} from '@gravity-ui/markdown-editor';

import {i18n} from '../i18n';
import {insertHeaderMarkup} from '../markup/commands';

export const headerItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'insert'),
    icon: {data: SquareDashed},
} satisfies ToolbarItemView;

export const headerItemWysiwyg = {
    exec: (e) => e.actions.insertHeader.run(),
    isActive: (e) => e.actions.insertHeader.isActive(),
    isEnable: (e) => e.actions.insertHeader.isEnable(),
} satisfies ToolbarItemWysiwyg;

export const headerItemMarkup = {
    exec: (e) => insertHeaderMarkup(e.cm),
    isActive: () => false,
    isEnable: () => true,
} satisfies ToolbarItemMarkup;
