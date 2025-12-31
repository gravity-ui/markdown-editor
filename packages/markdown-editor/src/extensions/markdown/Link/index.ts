import {InputRule} from 'prosemirror-inputrules';
import type {MarkType} from 'prosemirror-model';

import type {Action, ExtensionAuto} from '../../../core';
import {hasCodeMark} from '../../../utils/inputrules';

import {LinkSpecs, linkType} from './LinkSpecs';
import {type LinkActionMeta, type LinkActionParams, linkCommand} from './actions/linkActions';
import {addLinkCmd2, linkActionSpec2} from './actions/linkEnhanceActions';
import {linkPasteEnhance} from './paste-plugin';
import {linkTooltipPlugin} from './plugins/LinkTooltipPlugin';

export type {LinkActionParams, LinkActionMeta} from './actions/linkActions';
export {linkCommand} from './actions/linkActions';
export {normalizeUrlFactory} from './utils';
export {removeLink} from './commands';

export {LinkAttr, linkMarkName, linkType} from './LinkSpecs';
const linkAction = 'link';
const linkAction2 = 'addLink';

export type LinkOptions = {
    linkKey?: string | null;
};

export const Link: ExtensionAuto<LinkOptions> = (builder, opts) => {
    builder.use(LinkSpecs);

    builder.addAction(linkAction2, linkActionSpec2);
    builder.addPlugin(linkTooltipPlugin);

    if (opts?.linkKey) {
        const {linkKey} = opts;
        builder.addKeymap((deps) => ({
            [linkKey]: addLinkCmd2(deps),
        }));
    }

    builder
        .addPlugin(linkPasteEnhance, builder.Priority.High)
        .addAction(linkAction, (deps) => linkCommand(linkType(deps.schema), deps))
        .addInputRules(({schema}) => ({rules: [linkInputRule(linkType(schema))]}));
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [linkAction]: Action<LinkActionParams, LinkActionMeta>;
            [linkAction2]: Action;
        }
    }
}

// TODO: think about generalizing with markInputRule
function linkInputRule(markType: MarkType): InputRule {
    return new InputRule(/\[(.+)]\((\S+)\)\s$/, (state, match, start, end) => {
        if (hasCodeMark(state, match, start, end)) return null;

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
