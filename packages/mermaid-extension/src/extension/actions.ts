import type {ActionSpec} from '@gravity-ui/markdown-editor';
import {SharedStateKey, generateEntityId} from '@gravity-ui/markdown-editor';

import {MermaidConsts} from './MermaidSpecs/const';
import type {MermaidEntitySharedState} from './types';

export const addMermaid: ActionSpec = {
    isEnable(state) {
        return state.selection.empty;
    },
    run(state, dispatch) {
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
