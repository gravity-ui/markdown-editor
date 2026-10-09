import {InputRule} from 'prosemirror-inputrules';

import type {ExtensionAuto} from '../../../../core';
import {escapeRegExp} from '../../../../utils/ecapeRegexp';
import {hasCodeMark} from '../../../../utils/inputrules';
import {EmojiConsts, type EmojiSpecsOptions} from '../EmojiSpecs';

export const EmojiInput: ExtensionAuto<EmojiSpecsOptions> = (builder, opts) => {
    const {defs, shortcuts} = opts;
    if (defs && shortcuts) {
        const allPatternsForRegexp: string[] = [];
        const mapPatternToMarkup: Record<string, string> = {};

        for (const [markup, patterns] of Object.entries(shortcuts)) {
            if (!patterns) continue;
            const markupPatterns = ([] as string[]).concat(patterns);
            for (const pattern of markupPatterns) {
                allPatternsForRegexp.push(escapeRegExp(pattern));
                mapPatternToMarkup[pattern] = markup;
            }
        }

        if (allPatternsForRegexp.length) {
            const regex = new RegExp(`(?:^|\\s)(${allPatternsForRegexp.join('|')})\\s$`, 'g');
            builder.addInputRules(() => ({
                rules: [
                    new InputRule(regex, (state, match, start, end) => {
                        if (hasCodeMark(state, match, start, end)) return null;

                        const pattern = match[1];
                        const markup = mapPatternToMarkup[pattern];
                        const content = defs[markup];

                        if (content) {
                            const {tr, schema} = state;
                            const whitespaceAtStart = /^\s/.test(match[0]);
                            const from = start + (whitespaceAtStart ? 1 : 0);
                            const to = end;
                            return tr.replaceWith(from, to, [
                                EmojiConsts.nodeType(schema).create(
                                    {[EmojiConsts.NodeAttrs.Markup]: markup},
                                    schema.text(content),
                                ),
                                schema.text(' '),
                            ]);
                        }
                        return null;
                    }),
                ],
            }));
        }
    }
};
