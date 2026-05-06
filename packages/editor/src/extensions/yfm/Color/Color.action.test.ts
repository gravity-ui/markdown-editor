import type {MarkType} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';

import {ExtensionsManager} from '../../../core';
import type {ActionSpec} from '../../../core/types/actions';
import {BaseSchemaSpecs} from '../../base/specs';

import {colorMarkName, colorType} from './ColorSpecs';
import {colorAction} from './const';

import {Color} from './index';

const {schema, rawActions} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(Color),
}).build();

const action: ActionSpec = rawActions[colorAction];
const color: MarkType = colorType(schema);

// Both isActive and meta are populated by Color extension — narrow the optional
// signatures once so the tests don't need non-null assertions everywhere.
const isActive = action.isActive as (state: EditorState) => boolean;
const meta = action.meta as (state: EditorState) => string | undefined;

type Segment = string | {text: string; color: string};

/**
 * Build an EditorState whose first paragraph contains the given segments.
 * `from` / `to` are 0-based offsets within the paragraph text.
 */
function makeState(segments: Segment[], from: number, to: number): EditorState {
    const paragraph = schema.nodes.paragraph;
    const nodes = segments.map((seg) => {
        if (typeof seg === 'string') return schema.text(seg);
        return schema.text(seg.text, [color.create({[colorMarkName]: seg.color})]);
    });
    const doc = schema.node('doc', null, [paragraph.create(null, nodes)]);
    // PM positions: 0=before doc, 1=start of paragraph content
    const sel = TextSelection.create(doc, from + 1, to + 1);
    return EditorState.create({doc, selection: sel});
}

/** Run the action on `state`, return the resulting state. */
function run(state: EditorState, attrs?: {color?: string}): EditorState {
    const ref = {state};
    action.run(
        ref.state,
        (tr) => {
            ref.state = ref.state.apply(tr);
        },
        undefined as never,
        attrs,
    );
    return ref.state;
}

/** Collect color-mark values for every text node in the doc, in order. */
function colorOfTextNodes(state: EditorState): Array<string | undefined> {
    const colors: Array<string | undefined> = [];
    state.doc.descendants((node) => {
        if (node.isText) {
            const m = color.isInSet(node.marks);
            colors.push(m?.attrs[colorMarkName]);
        }
        return true;
    });
    return colors;
}

/** True if any text node has more than one color mark (sanity for `excludes`). */
function hasNestedColorMarks(state: EditorState): boolean {
    let nested = false;
    state.doc.descendants((node) => {
        if (node.isText) {
            const colorMarksOnNode = node.marks.filter((m) => m.type === color);
            if (colorMarksOnNode.length > 1) nested = true;
        }
        return true;
    });
    return nested;
}

function storedColor(state: EditorState): string | undefined {
    const m = state.storedMarks ? color.isInSet(state.storedMarks) : undefined;
    return m?.attrs[colorMarkName];
}

// ─── Risk 4: PM `excludes` default behaviour for parameterised marks ─────────

describe('Color action — default `excludes` behaviour (risk 4)', () => {
    it('C1: addMark replaces existing color mark over the whole paragraph', () => {
        // "ABC" all blue → run({color: 'red'}) → all red, no blue, no nesting
        const state = makeState([{text: 'ABC', color: 'blue'}], 0, 3);
        const next = run(state, {color: 'red'});
        expect(colorOfTextNodes(next)).toEqual(['red']);
        expect(hasNestedColorMarks(next)).toBe(false);
    });

    it('C2: addMark over [blue, plain, blue] makes the whole range red', () => {
        const state = makeState(
            [{text: 'AB', color: 'blue'}, 'CD', {text: 'EF', color: 'blue'}],
            0,
            6,
        );
        const next = run(state, {color: 'red'});
        // ranges may merge into fewer text nodes; assert every node is red.
        const colors = colorOfTextNodes(next);
        expect(colors.every((c) => c === 'red')).toBe(true);
        expect(hasNestedColorMarks(next)).toBe(false);
    });
});

// ─── Risk 1: wysiwyg toggle behaviour ────────────────────────────────────────

describe('Color action — toggle behaviour (risk 1)', () => {
    it('A1: empty selection, no stored marks → adds a stored color mark', () => {
        const state = makeState(['hello'], 2, 2);
        const next = run(state, {color: 'red'});
        expect(storedColor(next)).toBe('red');
        // Document content unchanged.
        expect(next.doc.eq(state.doc)).toBe(true);
    });

    it('A2: empty selection with same stored color → toggles stored mark off', () => {
        const base = makeState(['hello'], 2, 2);
        const withStored = base.apply(
            base.tr.addStoredMark(color.create({[colorMarkName]: 'red'})),
        );
        const next = run(withStored, {color: 'red'});
        expect(storedColor(next)).toBeUndefined();
    });

    it('A3: empty selection with different stored color → replaces stored mark', () => {
        const base = makeState(['hello'], 2, 2);
        const withStored = base.apply(
            base.tr.addStoredMark(color.create({[colorMarkName]: 'blue'})),
        );
        const next = run(withStored, {color: 'red'});
        expect(storedColor(next)).toBe('red');
    });

    it('A4: range fully red + click red → mark removed', () => {
        const state = makeState([{text: 'ABC', color: 'red'}], 0, 3);
        const next = run(state, {color: 'red'});
        expect(colorOfTextNodes(next).every((c) => c === undefined)).toBe(true);
    });

    it('A5: range [red, plain] + click red → all red (the headline fix)', () => {
        const state = makeState([{text: 'AB', color: 'red'}, 'CD'], 0, 4);
        const next = run(state, {color: 'red'});
        expect(colorOfTextNodes(next).every((c) => c === 'red')).toBe(true);
    });

    it('A6: range fully red + run({color: ""}) → mark removed', () => {
        const state = makeState([{text: 'ABC', color: 'red'}], 0, 3);
        const next = run(state, {color: ''});
        expect(colorOfTextNodes(next).every((c) => c === undefined)).toBe(true);
    });

    it('A7: range fully blue + click red → all red, no blue', () => {
        const state = makeState([{text: 'ABC', color: 'blue'}], 0, 3);
        const next = run(state, {color: 'red'});
        expect(colorOfTextNodes(next).every((c) => c === 'red')).toBe(true);
    });

    it('A8: range across two paragraphs + mixed coverage → all red', () => {
        const paragraph = schema.nodes.paragraph;
        const doc = schema.node('doc', null, [
            paragraph.create(null, [
                schema.text('AB', [color.create({[colorMarkName]: 'red'})]),
                schema.text('CD'),
            ]),
            paragraph.create(null, [
                schema.text('EF'),
                schema.text('GH', [color.create({[colorMarkName]: 'blue'})]),
            ]),
        ]);
        // Select from inside p1 to inside p2.
        const sel = TextSelection.create(doc, 2, 11);
        const state = EditorState.create({doc, selection: sel});
        const next = run(state, {color: 'red'});

        // Walk the resulting doc and assert every text node *inside* the original
        // selection range is red. We accept that text nodes outside the selection
        // keep their original mark.
        let allRedInRange = true;
        next.doc.nodesBetween(2, next.tr.mapping.map(11), (node, pos) => {
            if (!node.isText) return true;
            const c = color.isInSet(node.marks)?.attrs[colorMarkName];
            // Node entirely inside selection must be red.
            const nodeStart = pos;
            const nodeEnd = pos + node.nodeSize;
            if (nodeStart >= 2 && nodeEnd <= 11 && c !== 'red') allRedInRange = false;
            return true;
        });
        expect(allRedInRange).toBe(true);
    });
});

// ─── Risk 2: isActive + meta semantics ───────────────────────────────────────

describe('Color action — isActive / meta (risk 2)', () => {
    it('D1: cursor inside red word, no stored marks → isActive is true', () => {
        // "ABC" all red, cursor between A and B.
        const state = makeState([{text: 'ABC', color: 'red'}], 1, 1);
        expect(isActive(state)).toBe(true);
    });

    it('D2: range fully red → isActive reflects current cursor-style semantics', () => {
        // After PR: isActive reads `storedMarks ?? $to.marks()` — with TextSelection
        // both anchor and head live inside the colored text, so $to.marks() includes
        // the red mark. Pinning the actual return value as a regression guard.
        const state = makeState([{text: 'ABC', color: 'red'}], 0, 3);
        expect(isActive(state)).toBe(true);
    });

    it('E1: empty selection → run({red}) → meta returns "red" (via storedMarks)', () => {
        const state = makeState(['hello'], 2, 2);
        const next = run(state, {color: 'red'});
        expect(meta(next)).toBe('red');
    });

    it('E2: cursor inside red, no storedMarks → meta returns "red" (via $to)', () => {
        const state = makeState([{text: 'ABC', color: 'red'}], 1, 1);
        expect(meta(state)).toBe('red');
    });

    it('E3: after toggle-off (A2) → meta returns undefined', () => {
        const base = makeState(['hello'], 2, 2);
        const withStored = base.apply(
            base.tr.addStoredMark(color.create({[colorMarkName]: 'red'})),
        );
        const next = run(withStored, {color: 'red'});
        expect(meta(next)).toBeUndefined();
    });
});
