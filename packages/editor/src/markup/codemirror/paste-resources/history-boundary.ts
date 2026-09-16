import {Facet} from '@codemirror/state';

/** Register a history boundary for an external CodeMirror history implementation. */
export const pasteHistoryBoundary = Facet.define<() => void>();
