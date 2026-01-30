import {Slice} from 'prosemirror-model';
import {Plugin} from 'prosemirror-state';

import {checkboxType} from '../CheckboxSpecs';

export const fixPastePlugin = () =>
    new Plugin({
        props: {
            transformPasted(slice) {
                const {firstChild} = slice.content;
                if (firstChild && firstChild.type === checkboxType(firstChild.type.schema)) {
                    // When paste html with checkboxes and checkbox is first node,
                    // pm creates slice with broken openStart and openEnd.
                    // And content is inserted without a container block for checkboxes.
                    // It is fixed by create new slice with zeroed openStart and openEnd.
                    return new Slice(slice.content, 0, 0);
                }

                return slice;
            },
        },
    });
