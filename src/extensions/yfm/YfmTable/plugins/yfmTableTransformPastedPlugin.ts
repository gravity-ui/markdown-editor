import type {Schema} from 'prosemirror-model';
import {Plugin} from 'prosemirror-state';

import {fixPastedTableBodies} from '../paste';

interface Args {
    schema: Schema;
}
export const yfmTableTransformPastedPlugin = ({schema}: Args) =>
    new Plugin({
        props: {
            transformPasted(slice) {
                return fixPastedTableBodies(slice, schema);
            },
        },
    });
