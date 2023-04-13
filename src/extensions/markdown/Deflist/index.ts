import type {Action, ExtensionAuto} from '../../../core';
import {DeflistSpecs, DeflistSpecsOptions} from './DeflistSpecs';
import {splitDeflist, wrapToDeflist} from './commands';
import {dlAction} from './const';

export {DeflistNode, defListType, defTermType, defDescType} from './DeflistSpecs';

export type DeflistOptions = DeflistSpecsOptions & {};

export const Deflist: ExtensionAuto<DeflistOptions> = (builder, opts) => {
    builder.use(DeflistSpecs, opts);

    builder.addKeymap(() => ({Enter: splitDeflist}));

    builder.addAction(dlAction, () => {
        return {
            isEnable: wrapToDeflist,
            run: wrapToDeflist,
        };
    });
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [dlAction]: Action;
        }
    }
}
