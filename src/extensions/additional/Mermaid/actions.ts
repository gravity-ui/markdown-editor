import type {ActionSpec} from '../../../core';

import {mermaidNodeType} from './MermaidSpecs/const';

export const addMermaid: ActionSpec = {
    isEnable(state) {
        return state.selection.empty;
    },
    run(state, dispatch, _view) {
        dispatch(
            state.tr.insert(
                state.selection.from,
                mermaidNodeType(state.schema).create({
                    content: [
                        'sequenceDiagram',
                        '\tAlice->>Bob: Hi Bob',
                        '\tBob->>Alice: Hi Alice',
                    ].join('\n'),
                    newCreated: true,
                }),
            ),
        );
    },
};
