import type {ActionSpec} from '#core';
import {SharedStateKey} from 'src/extensions/behavior/SharedState';
import {generateEntityId} from 'src/utils/entity-id';

import {YfmHtmlBlockConsts, yfmHtmlBlockNodeType} from './YfmHtmlBlockSpecs/const';
import type {YfmHtmlBlockEntitySharedState} from './types';

export const addYfmHtmlBlock: ActionSpec = {
    isEnable(state) {
        return state.selection.empty;
    },
    run(state, dispatch, _view) {
        const entityId = generateEntityId(YfmHtmlBlockConsts.NodeName);
        const sharedKey = SharedStateKey.define<YfmHtmlBlockEntitySharedState>({name: entityId});

        const tr = state.tr.insert(
            state.selection.from,
            yfmHtmlBlockNodeType(state.schema).create({
                [YfmHtmlBlockConsts.NodeAttrs.srcdoc]: '\n',
                [YfmHtmlBlockConsts.NodeAttrs.newCreated]: true,
                [YfmHtmlBlockConsts.NodeAttrs.EntityId]: entityId,
            }),
        );

        sharedKey.appendTransaction.set(tr, {editing: true});

        dispatch(tr);
    },
};
