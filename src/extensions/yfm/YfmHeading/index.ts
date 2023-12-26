import type {Action, ExtensionAuto, Keymap} from '../../../core';
import {withLogAction} from '../../../utils/keymap';

import {YfmHeadingSpecs, YfmHeadingSpecsOptions} from './YfmHeadingSpecs';
import {hType, headingRule} from './YfmHeadingSpecs/utils';
import {headingAction} from './actions';
import {resetHeading, toHeading} from './commands';
import {HeadingAction} from './const';

export {YfmHeadingAttr} from './const';

export type YfmHeadingOptions = YfmHeadingSpecsOptions & {
    h1Key?: string | null;
    h2Key?: string | null;
    h3Key?: string | null;
    h4Key?: string | null;
    h5Key?: string | null;
    h6Key?: string | null;
};

/** YfmHeading extension needs markdown-it-attrs plugin */
export const YfmHeading: ExtensionAuto<YfmHeadingOptions> = (builder, opts) => {
    builder.use(YfmHeadingSpecs, opts);

    builder
        .addKeymap(() => {
            const {h1Key, h2Key, h3Key, h4Key, h5Key, h6Key} = opts ?? {};
            const bindings: Keymap = {Backspace: resetHeading};
            if (h1Key) bindings[h1Key] = withLogAction('heading1', toHeading(1));
            if (h2Key) bindings[h2Key] = withLogAction('heading2', toHeading(2));
            if (h3Key) bindings[h3Key] = withLogAction('heading3', toHeading(3));
            if (h4Key) bindings[h4Key] = withLogAction('heading4', toHeading(4));
            if (h5Key) bindings[h5Key] = withLogAction('heading5', toHeading(5));
            if (h6Key) bindings[h6Key] = withLogAction('heading6', toHeading(6));
            return bindings;
        })
        .addInputRules(({schema}) => ({rules: [headingRule(hType(schema), 6)]}));

    builder
        .addAction(HeadingAction.ToH1, () => headingAction(1))
        .addAction(HeadingAction.ToH2, () => headingAction(2))
        .addAction(HeadingAction.ToH3, () => headingAction(3))
        .addAction(HeadingAction.ToH4, () => headingAction(4))
        .addAction(HeadingAction.ToH5, () => headingAction(5))
        .addAction(HeadingAction.ToH6, () => headingAction(6));
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [HeadingAction.ToH1]: Action;
            [HeadingAction.ToH2]: Action;
            [HeadingAction.ToH3]: Action;
            [HeadingAction.ToH4]: Action;
            [HeadingAction.ToH5]: Action;
            [HeadingAction.ToH6]: Action;
        }
    }
}
