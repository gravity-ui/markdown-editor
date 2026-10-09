import {getMatchHighlights} from 'prosemirror-search';

import type {EditorState} from '#pm/state';
import type {SearchCounter} from 'src/modules/search';

import {SearchClassName} from '../const';

export function getCounter(state: EditorState): SearchCounter {
    const decoSet = getMatchHighlights(state);
    const searchDecos = decoSet.find(undefined, undefined, () => true);
    const activeIndex = searchDecos.findIndex((deco) => {
        const d = deco as {type?: {attrs?: Record<string, any>}};
        return d.type?.attrs?.class === SearchClassName.ActiveMatch;
    });
    return {
        total: searchDecos.length,
        current: activeIndex + 1,
    };
}
