import type {ActionSpec} from '#core';
import {generateEntityId} from 'src/utils/entity-id';

import {
    YfmHtmlConstructorConsts,
    emptyHtmlConstructorStructure,
    yfmHtmlConstructorNodeType,
} from './YfmHtmlConstructorSpecs';

export const addYfmHtmlConstructor: ActionSpec = {
    isEnable(state) {
        return state.selection.empty;
    },
    run(state, dispatch) {
        const entityId = generateEntityId(YfmHtmlConstructorConsts.NodeName);

        const tr = state.tr.insert(
            state.selection.from,
            yfmHtmlConstructorNodeType(state.schema).create({
                [YfmHtmlConstructorConsts.NodeAttrs.structure]: emptyHtmlConstructorStructure(),
                [YfmHtmlConstructorConsts.NodeAttrs.blocks]: [],
                [YfmHtmlConstructorConsts.NodeAttrs.EntityId]: entityId,
            }),
        );

        dispatch(tr);
    },
};
