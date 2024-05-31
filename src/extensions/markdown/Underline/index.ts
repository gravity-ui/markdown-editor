import {toggleMark} from 'prosemirror-commands';

import type {Action, ExtensionAuto} from '../../../core';
import {createToggleMarkAction} from '../../../utils/actions';
import {markInputRule} from '../../../utils/inputrules';
import {withLogAction} from '../../../utils/keymap';

import {UnderlineSpecs, underlineMarkName, underlineType} from './UnderlineSpecs';

export {underlineMarkName, underlineType} from './UnderlineSpecs';
/** @deprecated Use `underlineMarkName` instead */
export const underline = underlineMarkName;
const undAction = 'underline';

export type UnderlineOptions = {
    underlineKey?: string | null;
};

export const Underline: ExtensionAuto<UnderlineOptions> = (builder, opts) => {
    builder.use(UnderlineSpecs);

    builder
        .addAction(undAction, ({schema}) => createToggleMarkAction(underlineType(schema)))
        .addInputRules(({schema}) => ({
            rules: [
                markInputRule({open: '++', close: '++', ignoreBetween: '+'}, underlineType(schema)),
            ],
        }));

    if (opts?.underlineKey) {
        const {underlineKey} = opts;
        builder.addKeymap(({schema}) => ({
            [underlineKey]: withLogAction('underline', toggleMark(underlineType(schema))),
        }));
    }
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [undAction]: Action;
        }
    }
}
