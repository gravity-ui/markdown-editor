import log from '@doc-tools/transform/lib/log';
import yfmPlugin from '@doc-tools/transform/lib/plugins/cut';
import {chainCommands} from 'prosemirror-commands';
import type {Action, ExtensionAuto} from '../../../core';
import {nodeInputRule} from '../../../utils/inputrules';
import {toYfm} from './toYfm';
import {CutNode, cutType} from './const';
import {fromYfm} from './fromYfm';
import {getSpec, YfmCutSpecOptions} from './spec';
import {createYfmCut, toYfmCut} from './actions/toYfmCut';
import {backToCutTitle, exitFromCutTitle, liftEmptyBlockFromCut, removeCut} from './commands';
import {YfmCutTitleNodeView} from './nodeviews/yfm-cut-title';

const cutAction = 'toYfmCut';

export {CutNode, cutType, cutTitleType, cutContentType} from './const';

export type YfmCutOptions = YfmCutSpecOptions & {
    yfmCutKey?: string | null;
};

export const YfmCut: ExtensionAuto<YfmCutOptions> = (builder, opts) => {
    const spec = getSpec(opts);

    builder
        .configureMd((md) => md.use(yfmPlugin, {log}))
        .addNode(CutNode.Cut, () => ({
            spec: spec[CutNode.Cut],
            toYfm: toYfm[CutNode.Cut],
            fromYfm: {
                tokenSpec: fromYfm[CutNode.Cut],
            },
            // FIX: ignore mutation and don't rerender node when yfm.js open or close cut
            // @ts-expect-error
            view: () => () => ({
                ignoreMutation(mutation) {
                    return mutation instanceof MutationRecord && mutation.type === 'attributes';
                },
            }),
        }))
        .addNode(CutNode.CutTitle, () => ({
            spec: spec[CutNode.CutTitle],
            toYfm: toYfm[CutNode.CutTitle],
            fromYfm: {
                tokenSpec: fromYfm[CutNode.CutTitle],
            },
            view: () => (node) => new YfmCutTitleNodeView(node),
        }))
        .addNode(CutNode.CutContent, () => ({
            spec: spec[CutNode.CutContent],
            toYfm: toYfm[CutNode.CutContent],
            fromYfm: {
                tokenSpec: fromYfm[CutNode.CutContent],
            },
        }))
        .addAction(cutAction, () => toYfmCut)
        .addKeymap(() => ({
            Backspace: chainCommands(backToCutTitle, removeCut),
            Enter: chainCommands(exitFromCutTitle, liftEmptyBlockFromCut),
        }))
        .addInputRules(({schema}) => ({
            rules: [nodeInputRule(/(?:^)({% cut)\s$/, cutType(schema).createAndFill(), 1)],
        }));

    if (opts?.yfmCutKey) {
        const {yfmCutKey} = opts;
        builder.addKeymap(() => ({[yfmCutKey]: createYfmCut}));
    }
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [cutAction]: Action;
        }
    }
}
