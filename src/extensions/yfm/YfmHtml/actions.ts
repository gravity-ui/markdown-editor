import {ActionSpec} from '../../../core';

import {YfmHtmlConsts, yfmHtmlNodeType} from './YfmHtmlSpecs/const';

export const addYfmHtml: ActionSpec = {
    isEnable(state) {
        return state.selection.empty;
    },
    run(state, dispatch, _view) {
        dispatch(
            state.tr.insert(
                state.selection.from,
                yfmHtmlNodeType(state.schema).create({
                    [YfmHtmlConsts.NodeAttrs.srcdoc]: '\n',
                    [YfmHtmlConsts.NodeAttrs.newCreated]: true,
                }),
            ),
        );
    },
};
