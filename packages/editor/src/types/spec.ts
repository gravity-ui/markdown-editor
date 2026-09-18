////////////////////////////////////////////////////
///                                              ///
///   This is a place to extend spec types       ///
///                                              ///
////////////////////////////////////////////////////

import type {ResourceDescription} from '../modules/resource-replacement/types';

declare module 'prosemirror-model' {
    interface NodeSpec {
        /** Resource URL metadata. Omit to exclude this node from resource replacement. */
        resource?: ResourceDescription;

        /**
         * Determines whether this node is part of complex block,
         * e.g. yfm-cut, yfm-note, tables, etc...
         * And indicates its own role
         */
        complex?: 'root' | 'inner' | 'leaf';
        escapeText?: boolean;

        /**
         * Set `false` to disable gapcursor selection inside this node.
         * @default true
         */
        gapcursor?: boolean;
    }

    interface MarkSpec {
        /**
         * Can be used to indicate that this mark contains code.
         */
        code?: boolean;
    }
}
