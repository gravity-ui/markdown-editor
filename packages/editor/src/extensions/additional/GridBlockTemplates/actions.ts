import type {ActionSpec} from '#core';
import {generateEntityId} from 'src/utils/entity-id';

import {
    GridBlockTemplatesConsts,
    gridBlockTemplatesNodeType,
} from './GridBlockTemplatesSpecs/const';

export const addGridBlockTemplates: ActionSpec = {
    isEnable(state) {
        return state.selection.empty;
    },
    run(state, dispatch) {
        const entityId = generateEntityId(GridBlockTemplatesConsts.NodeName);

        const tr = state.tr.insert(
            state.selection.from,
            gridBlockTemplatesNodeType(state.schema).create({
                [GridBlockTemplatesConsts.NodeAttrs.blocks]: [],
                [GridBlockTemplatesConsts.NodeAttrs.customCss]: '',
                [GridBlockTemplatesConsts.NodeAttrs.EntityId]: entityId,
            }),
        );

        dispatch(tr);
    },
};
