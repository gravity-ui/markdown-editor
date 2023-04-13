import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';

export const strikeMarkName = 'strike';
export const strikeType = markTypeFactory(strikeMarkName);

export const StrikeSpecs: ExtensionAuto = (builder) => {
    builder.addMark(strikeMarkName, () => ({
        spec: {
            parseDOM: [{tag: 'strike'}, {tag: 's'}],
            toDOM() {
                return ['strike'];
            },
        },
        fromYfm: {
            tokenSpec: {
                name: strikeMarkName,
                type: 'mark',
            },
            tokenName: 's',
        },
        toYfm: {open: '~~', close: '~~', mixable: true, expelEnclosingWhitespace: true},
    }));
};
