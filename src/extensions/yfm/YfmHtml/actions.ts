import {ActionSpec} from '../../../core';

import {yfmHtmlNodeType} from './YfmHtmlSpecs/const';

export const addYfmHtml: ActionSpec = {
    isEnable(state) {
        return state.selection.empty;
    },
    run(state, dispatch, _view) {
        dispatch(
            state.tr.insert(
                state.selection.from,
                yfmHtmlNodeType(state.schema).create({
                    content: [
                        '::: html',
                        '\t',
                        ':::',
                    ].join('\n'),
                    newCreated: true,
                }),
            ),
        );
    },
};
