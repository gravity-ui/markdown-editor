import type {Command} from 'prosemirror-state';

import type {Action, ExtensionAuto} from '../../../core';
import {inlineAtomCursorPlugin, isInlineAtomSelected} from '../../../plugins/InlineAtom';

import {dateTooltipPlugin} from './DateTooltip';
import {YfmDateSpecs, dateType, getTodayIsoDate} from './YfmDateSpecs';
import {dateKeymap, insertDate} from './commands';
import {dateEditPlugin} from './edit-state';

export * from './YfmDateSpecs';
export {insertDate, updateDate} from './commands';

const dateAction = 'addDate';

export const YfmDate: ExtensionAuto = (builder) => {
    builder.use(YfmDateSpecs);

    builder
        .addPlugin(dateEditPlugin)
        .addPlugin(dateTooltipPlugin)
        .addPlugin(() => inlineAtomCursorPlugin(dateType));
    builder.addKeymap(() => dateKeymap, builder.Priority.High);

    builder.addAction(dateAction, () => {
        // The current local day; the calendar opens right away to pick another one.
        const cmd: Command = (state, dispatch, view) =>
            insertDate(getTodayIsoDate())(state, dispatch, view);

        return {
            isActive: (state) => isInlineAtomSelected(state, dateType),
            isEnable: cmd,
            run: cmd,
        };
    });
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [dateAction]: Action;
        }
    }
}
