import {toggleMark} from 'prosemirror-commands';

import type {Action, ExtensionAuto} from '../../../core';
import {createToggleMarkAction} from '../../../utils/actions';
import {markInputRule} from '../../../utils/inputrules';
import {withLogAction} from '../../../utils/keymap';

import {StrikeSpecs, strikeMarkName, strikeType} from './StrikeSpecs';

export {strikeMarkName, strikeType} from './StrikeSpecs';
/** @deprecated Use `strikeMarkName` instead */
export const strike = strikeMarkName;
const sAction = 'strike';

export type StrikeOptions = {
    strikeKey?: string | null;
};

export const Strike: ExtensionAuto<StrikeOptions> = (builder, opts) => {
    builder.use(StrikeSpecs);

    builder
        .addAction(sAction, ({schema}) => createToggleMarkAction(strikeType(schema)))
        .addInputRules(({schema}) => ({
            rules: [
                markInputRule({open: '~~', close: '~~', ignoreBetween: '~'}, strikeType(schema)),
            ],
        }));

    if (opts?.strikeKey) {
        const {strikeKey} = opts;
        builder.addKeymap(({schema}) => ({
            [strikeKey]: withLogAction('strike', toggleMark(strikeType(schema))),
        }));
    }
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [sAction]: Action;
        }
    }
}
