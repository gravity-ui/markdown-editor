import {setBlockType} from 'prosemirror-commands';
import type {Action, ExtensionAuto, Keymap} from '../../../core';
import {headingAction} from './actions';
import {HeadingAction, HeadingLevel, headingLevelAttr} from './const';
import {headingRule, hType} from './utils';
import {resetHeading} from './commands';
import {HeadingSpecs, HeadingSpecsOptions} from './HeadingSpecs';

export {headingNodeName, headingType} from './HeadingSpecs';
export {HeadingAction} from './const';
export {hType} from './utils';

export type HeadingOptions = HeadingSpecsOptions & {
    h1Key?: string | null;
    h2Key?: string | null;
    h3Key?: string | null;
    h4Key?: string | null;
    h5Key?: string | null;
    h6Key?: string | null;
};

export const Heading: ExtensionAuto<HeadingOptions> = (builder, opts) => {
    builder.use(HeadingSpecs, opts);

    builder
        .addKeymap(({schema}) => {
            const {h1Key, h2Key, h3Key, h4Key, h5Key, h6Key} = opts ?? {};
            const cmd4lvl = (level: HeadingLevel) =>
                setBlockType(hType(schema), {[headingLevelAttr]: level});

            const bindings: Keymap = {Backspace: resetHeading};
            if (h1Key) bindings[h1Key] = cmd4lvl(1);
            if (h2Key) bindings[h2Key] = cmd4lvl(2);
            if (h3Key) bindings[h3Key] = cmd4lvl(3);
            if (h4Key) bindings[h4Key] = cmd4lvl(4);
            if (h5Key) bindings[h5Key] = cmd4lvl(5);
            if (h6Key) bindings[h6Key] = cmd4lvl(6);
            return bindings;
        })
        .addInputRules(({schema}) => ({rules: [headingRule(hType(schema), 6)]}));

    builder
        .addAction(HeadingAction.ToH1, ({schema}) => headingAction(hType(schema), 1))
        .addAction(HeadingAction.ToH2, ({schema}) => headingAction(hType(schema), 2))
        .addAction(HeadingAction.ToH3, ({schema}) => headingAction(hType(schema), 3))
        .addAction(HeadingAction.ToH4, ({schema}) => headingAction(hType(schema), 4))
        .addAction(HeadingAction.ToH5, ({schema}) => headingAction(hType(schema), 5))
        .addAction(HeadingAction.ToH6, ({schema}) => headingAction(hType(schema), 6));
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
