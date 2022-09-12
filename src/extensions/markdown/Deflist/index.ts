import type {PluginSimple} from 'markdown-it';
import {Action, createExtension, ExtensionAuto} from '../../../core';
import {DeflistNode, dlAction} from './const';
import {splitDeflist, wrapToDeflist} from './commands';
import {fromYfm} from './fromYfm';
import {toYfm} from './toYfm';
import {DeflistSpecOptions, getSpec} from './spec';
const mdPlugin: PluginSimple = require('markdown-it-deflist');

export type DeflistOptions = DeflistSpecOptions & {};

export const Deflist: ExtensionAuto<DeflistOptions> = (builder, opts) => {
    const spec = getSpec(opts);

    builder.configureMd((md) => md.use(mdPlugin));
    builder
        .addNode(DeflistNode.List, () => ({
            spec: spec[DeflistNode.List],
            fromYfm: {tokenSpec: fromYfm[DeflistNode.List]},
            toYfm: toYfm[DeflistNode.List],
        }))
        .addNode(DeflistNode.Term, () => ({
            spec: spec[DeflistNode.Term],
            fromYfm: {tokenSpec: fromYfm[DeflistNode.Term]},
            toYfm: toYfm[DeflistNode.Term],
        }))
        .addNode(DeflistNode.Desc, () => ({
            spec: spec[DeflistNode.Desc],
            fromYfm: {tokenSpec: fromYfm[DeflistNode.Desc]},
            toYfm: toYfm[DeflistNode.Desc],
        }));

    builder.addKeymap(() => ({Enter: splitDeflist}));

    builder.addAction(dlAction, () => {
        return {
            isEnable: wrapToDeflist,
            run: wrapToDeflist,
        };
    });
};

/**
 * @deprecated
 * For tests only.
 * Remove after WIKI-16660
 */
export const DeflistE = createExtension<DeflistOptions>((b, o = {}) => b.use(Deflist, o));

declare global {
    namespace YfmEditor {
        interface Actions {
            [dlAction]: Action;
        }
    }
}
