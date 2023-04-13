import {InputRule} from 'prosemirror-inputrules';
import type {MarkType} from 'prosemirror-model';

import type {Action, ExtensionAuto} from '../../../core';
import {LinkActionMeta, LinkActionParams, linkCommand} from './actions';
import {linkPasteEnhance} from './paste-plugin';
import {linkMarkName, LinkSpecs, linkType} from './LinkSpecs';

export type {LinkActionParams, LinkActionMeta} from './actions';
export {linkCommand} from './actions';
export {normalizeUrlFactory} from './utils';
export {removeLink} from './commands';

export {LinkAttr, linkMarkName, linkType} from './LinkSpecs';
/** @deprecated Use `linkMarkName` instead */
export const link = linkMarkName;
const linkAction = 'link';

export const Link: ExtensionAuto = (builder) => {
    builder.use(LinkSpecs);

    builder
        .addPlugin(linkPasteEnhance, builder.Priority.High)
        .addAction(linkAction, (deps) => linkCommand(linkType(deps.schema), deps))
        .addInputRules(({schema}) => ({rules: [linkInputRule(linkType(schema))]}));
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [linkAction]: Action<LinkActionParams, LinkActionMeta>;
        }
    }
}

// TODO: think about generalizing with markInputRule
function linkInputRule(markType: MarkType): InputRule {
    return new InputRule(/\[(.+)]\((\S+)\)\s$/, (state, match, start, end) => {
        // handle the rule only if is start of line or there is a space before "open" symbols
        if ((match as RegExpMatchArray).index! > 0) {
            const re = match as RegExpMatchArray;
            if (re.input![re.index! - 1] !== ' ') return null;
        }

        const [okay, alt, href] = match;
        const {tr} = state;

        if (okay) {
            tr.replaceWith(start, end, markType.schema.text(alt)).addMark(
                start,
                start + alt.length,
                markType.create({href}),
            );
        }

        return tr;
    });
}
