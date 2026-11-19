import type {Schema} from 'prosemirror-model';
import {Plugin} from 'prosemirror-state';

import {insertPasteSlice} from 'src/table-utils/matrix/paste-slice';

import {YfmTableNode} from '../YfmTableSpecs/const';
import {fixPastedTableBodies, unpackSingleCellTable} from '../paste';

interface Args {
    schema: Schema;
    matrixEnabled?: boolean;
}
export const yfmTableTransformPastedPlugin = ({schema, matrixEnabled = false}: Args) =>
    new Plugin({
        props: {
            transformPasted(slice) {
                if (
                    !matrixEnabled ||
                    slice.openStart !== 0 ||
                    slice.openEnd !== 0 ||
                    slice.content.childCount !== 1 ||
                    slice.content.firstChild?.type.name !== YfmTableNode.Table
                )
                    slice = unpackSingleCellTable(slice);
                slice = fixPastedTableBodies(slice, schema);
                return slice;
            },
            handlePaste(view, _event, slice) {
                if (!matrixEnabled) return false;
                const unpacked = unpackSingleCellTable(slice);
                if (unpacked === slice) return false;
                insertPasteSlice(view, unpacked);
                return true;
            },
        },
    });
