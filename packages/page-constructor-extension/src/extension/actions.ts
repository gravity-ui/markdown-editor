import type {ActionSpec} from '@gravity-ui/markdown-editor';
import {SharedStateKey, generateEntityId, get$Cursor, pType} from '@gravity-ui/markdown-editor';
import type {Command} from '@gravity-ui/markdown-editor/pm/state';

import {YfmPageConstructorConsts} from './YfmPageConstructorSpecs/const';
import type {YfmPageConstructorEntitySharedState} from './types';

const defaultYfmPageConstructorContent = [
    'blocks:',
    '  - type: "header-block"',
    '    title: "Title"',
    '    description: "Description"',
].join('\n');

const createYfmPageConstructor: Command = (state, dispatch) => {
    const $cursor = get$Cursor(state.selection);

    if ($cursor?.parent.type !== pType(state.schema)) {
        return false;
    }

    const newEntityId = generateEntityId(YfmPageConstructorConsts.NodeName);
    const node = YfmPageConstructorConsts.nodeType(state.schema).create({
        [YfmPageConstructorConsts.NodeAttrs.content]: defaultYfmPageConstructorContent,
        [YfmPageConstructorConsts.NodeAttrs.EntityId]: newEntityId,
    });

    if (dispatch) {
        const {tr} = state;
        const sharedKey = SharedStateKey.define<YfmPageConstructorEntitySharedState>({
            name: newEntityId,
        });

        tr.replaceSelectionWith(node);
        sharedKey.appendTransaction.set(tr, {editing: true});
        dispatch(tr.scrollIntoView());
    }

    return true;
};

export const addYfmPageConstructor: ActionSpec = {
    isActive() {
        return false;
    },
    isEnable(state) {
        return createYfmPageConstructor(state);
    },
    run(state, dispatch, view) {
        createYfmPageConstructor(state, dispatch, view);
    },
};
