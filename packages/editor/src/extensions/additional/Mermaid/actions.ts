import type {ActionSpec} from '#core';
import {SharedStateKey} from 'src/extensions/behavior/SharedState/utils';
import {generateEntityId} from 'src/utils/entity-id';

import {MermaidConsts} from './MermaidSpecs';
import type {MermaidEntitySharedState} from './types';

export const addMermaid: ActionSpec = {
    isEnable(state) {
        return state.selection.empty;
    },
    run(state, dispatch, _view) {
        const newEntityId = generateEntityId(MermaidConsts.NodeName);
        const sharedKey = SharedStateKey.define<MermaidEntitySharedState>({name: newEntityId});

        const tr = state.tr.insert(
            state.selection.from,
            MermaidConsts.nodeType(state.schema).create({
                [MermaidConsts.NodeAttrs.content]: [
                    'sequenceDiagram',
                    '\tAlice->>Bob: Hi Bob',
                    '\tBob->>Alice: Hi Alice',
                ].join('\n'),
                [MermaidConsts.NodeAttrs.newCreated]: true,
                [MermaidConsts.NodeAttrs.EntityId]: newEntityId,
            }),
        );

        sharedKey.appendTransaction.set(tr, {editing: true});

        dispatch(tr);
    },
};
