import {Plugin} from '#pm/state';
import {Decoration, DecorationSet} from '#pm/view';

import {HeaderClassName} from '../HeaderSpecs';
import {findHeader} from '../commands';

export const headerActivePlugin = () =>
    new Plugin({
        props: {
            decorations(state) {
                const found = findHeader(state);
                if (!found) return DecorationSet.empty;

                return DecorationSet.create(state.doc, [
                    Decoration.node(found.pos, found.pos + found.node.nodeSize, {
                        class: `${HeaderClassName.Header}_active`,
                    }),
                ]);
            },
        },
    });
