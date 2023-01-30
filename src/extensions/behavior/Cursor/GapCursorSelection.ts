import {Selection} from 'prosemirror-state';
import type {Node, ResolvedPos} from 'prosemirror-model';
import type {Mapping} from 'prosemirror-transform';

export function isGapCursorSelection<T>(selection: Selection): selection is GapCursorSelection<T> {
    return selection instanceof GapCursorSelection;
}

// @ts-expect-error // TODO: implements toJSON
export class GapCursorSelection<T = any> extends Selection {
    #_$pos: ResolvedPos;

    readonly meta?: T;

    readonly selectionName = 'GapCursorSelection';

    get $pos(): ResolvedPos {
        return this.#_$pos;
    }

    get pos(): number {
        return this.#_$pos.pos;
    }

    constructor($pos: ResolvedPos, params?: {meta?: T}) {
        super($pos, $pos);
        this.#_$pos = $pos;
        this.meta = params?.meta;
    }

    eq(other: Selection): boolean {
        return (
            isGapCursorSelection(other) &&
            this.pos === other.pos &&
            this.$pos.doc.eq(other.$pos.doc)
        );
    }

    map(doc: Node, mapping: Mapping): Selection {
        const $pos = doc.resolve(mapping.map(this.head));
        return Selection.near($pos);
    }
}
