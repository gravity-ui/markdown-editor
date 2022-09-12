////////////////////////////////////////////////////
///                                              ///
///   This is a place to extend spec types       ///
///                                              ///
////////////////////////////////////////////////////

export {};

declare module 'prosemirror-model' {
    interface NodeSpec {
        /**
         * Determines whether this node is part of complex block,
         * e.g. yfm-cut, yfm-note, tables, etc...
         * And indicates its own role
         */
        complex?: 'root' | 'inner' | 'leaf';
        escapeText?: boolean;
    }

    interface MarkSpec {
        /**
         * Can be used to indicate that this mark contains code.
         */
        code?: boolean;
    }
}
