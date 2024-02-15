import {chainCommands} from 'prosemirror-commands';

import type {Action, ExtensionAuto} from '../../../core';
import {nodeInputRule} from '../../../utils/inputrules';
import {withLogAction} from '../../../utils/keymap';

import {YfmCutSpecs, YfmCutSpecsOptions} from './YfmCutSpecs';
import {createYfmCut, toYfmCut} from './actions/toYfmCut';
import {backToCutTitle, exitFromCutTitle, liftEmptyBlockFromCut, removeCut} from './commands';
import {cutType} from './const';
import {YfmCutTitleNodeView} from './nodeviews/yfm-cut-title';
import {cutActivePlugin} from './plugins/active';
import {cutAutoOpenPlugin} from './plugins/auto-open';

import './index.scss';

const cutAction = 'toYfmCut';

export {CutNode, cutType, cutTitleType, cutContentType} from './YfmCutSpecs';

export type YfmCutOptions = Pick<
    YfmCutSpecsOptions,
    'yfmCutTitlePlaceholder' | 'yfmCutContentPlaceholder'
> & {
    yfmCutKey?: string | null;
};

export const YfmCut: ExtensionAuto<YfmCutOptions> = (builder, opts) => {
    builder.use(YfmCutSpecs, {
        ...opts,
        // @ts-expect-error
        cutView:
            // FIX: ignore mutation and don't rerender node when yfm.js open or close cut
            () => () => ({
                ignoreMutation(mutation) {
                    return mutation instanceof MutationRecord && mutation.type === 'attributes';
                },
            }),
        cutTitleView: () => (node) => new YfmCutTitleNodeView(node),
    });

    builder
        .addPlugin(cutActivePlugin)
        .addPlugin(cutAutoOpenPlugin)
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
        builder.addKeymap(() => ({[yfmCutKey]: withLogAction('yfm_cut', createYfmCut)}));
    }
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [cutAction]: Action;
        }
    }
}
