import {Selection} from 'prosemirror-state';
import type {Node, ResolvedPos} from 'prosemirror-model';
import type {Mapping} from 'prosemirror-transform';

// @ts-expect-error // TODO: implements toJSON
export class GapCursorSelection extends Selection {
    constructor(pos: ResolvedPos) {
        super(pos, pos);
    }

    eq(other: Selection): boolean {
        return other instanceof GapCursorSelection && other.head === this.head;
    }

    map(doc: Node, mapping: Mapping): Selection {
        const $pos = doc.resolve(mapping.map(this.head));

        return Selection.near($pos);
    }
}
