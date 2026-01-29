import type {Schema} from 'prosemirror-model';
import {Plugin} from 'prosemirror-state';

import {fixPastedTableBodies, unpackSingleCellTable} from '../paste';

interface Args {
    schema: Schema;
}
export const yfmTableTransformPastedPlugin = ({schema}: Args) =>
    new Plugin({
        props: {
            transformPasted(slice) {
                slice = unpackSingleCellTable(slice);
                slice = fixPastedTableBodies(slice, schema);
                return slice;
            },
        },
    });
