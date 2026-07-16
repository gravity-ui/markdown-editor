import type {ActionSpec} from '#core';
import {generateEntityId} from 'src/utils/entity-id';

import {GridBlockConsts, gridBlockNodeType} from './GridBlockSpecs/const';

export const addGridBlock: ActionSpec = {
    isEnable(state) {
        return state.selection.empty;
    },
    run(state, dispatch) {
        const entityId = generateEntityId(GridBlockConsts.NodeName);

        const tr = state.tr.insert(
            state.selection.from,
            gridBlockNodeType(state.schema).create({
                [GridBlockConsts.NodeAttrs.blocks]: [],
                [GridBlockConsts.NodeAttrs.containerCss]: '',
                [GridBlockConsts.NodeAttrs.EntityId]: entityId,
            }),
        );

        dispatch(tr);
    },
};
