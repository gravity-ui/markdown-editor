import {HandPointUp} from '@gravity-ui/icons';

import {i18n} from 'src/i18n/button';
import {replaceOrInsertAfter} from 'src/markup/commands/helpers';
import type {
    ToolbarItemMarkup,
    ToolbarItemView,
    ToolbarItemWysiwyg,
} from 'src/modules/toolbars/types';
import {ToolbarDataType} from 'src/toolbar';

import {buttonDirectiveName} from './ButtonSpecs';
import {buttonAction} from './actions';

export const buttonItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: () => i18n('insert'),
    icon: {data: HandPointUp},
};

export const buttonItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => e.actions[buttonAction].run(),
    isActive: () => false,
    isEnable: (e) => e.actions[buttonAction].isEnable(),
};

export const buttonItemMarkup: ToolbarItemMarkup = {
    exec: ({cm}) => {
        const markup = `::${buttonDirectiveName}[${i18n('label_default')}]()`;
        cm.dispatch(cm.state.update(replaceOrInsertAfter(cm.state, markup)));
    },
    isActive: () => false,
    isEnable: () => true,
};
