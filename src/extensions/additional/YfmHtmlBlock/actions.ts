import type {ActionSpec} from '../../../core';

import {YfmHtmlBlockConsts, yfmHtmlBlockNodeType} from './YfmHtmlBlockSpecs/const';

export const addYfmHtmlBlock: ActionSpec = {
    isEnable(state) {
        return state.selection.empty;
    },
    run(state, dispatch, _view) {
        dispatch(
            state.tr.insert(
                state.selection.from,
                yfmHtmlBlockNodeType(state.schema).create({
                    [YfmHtmlBlockConsts.NodeAttrs.srcdoc]: '\n',
                    [YfmHtmlBlockConsts.NodeAttrs.newCreated]: true,
                }),
            ),
        );
    },
};
