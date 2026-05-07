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
const isActive = action.isActive as (state: EditorState) => boolean;
const meta = action.meta as (state: EditorState) => string | undefined;

type Segment = string | {text: string; color: string};

function makeState(segments: Segment[], from: number, to: number): EditorState {
    const paragraph = schema.nodes.paragraph;
    const nodes = segments.map((segment) =>
        typeof segment === 'string'
            ? schema.text(segment)
            : schema.text(segment.text, [color.create({[colorMarkName]: segment.color})]),
    );
    const doc = schema.node('doc', null, [paragraph.create(null, nodes)]);
    const selection = TextSelection.create(doc, from + 1, to + 1);
    return EditorState.create({doc, selection});
}

function run(state: EditorState, attrs?: {color?: string}) {
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

function colorValues(state: EditorState) {
    const values: Array<string | undefined> = [];
    state.doc.descendants((node) => {
        if (node.isText) {
            values.push(color.isInSet(node.marks)?.attrs[colorMarkName]);
        }
        return true;
    });
    return values;
}

function storedColor(state: EditorState) {
    return color.isInSet(state.storedMarks ?? [])?.attrs[colorMarkName];
}

describe('Color action', () => {
    it('adds a stored color mark at the cursor', () => {
        const next = run(makeState(['hello'], 2, 2), {color: 'red'});

        expect(storedColor(next)).toBe('red');
    });

    it('removes the stored color when the same color is chosen at the cursor', () => {
        const base = makeState(['hello'], 2, 2);
        const withStored = base.apply(
            base.tr.addStoredMark(color.create({[colorMarkName]: 'red'})),
        );

        expect(storedColor(run(withStored, {color: 'red'}))).toBeUndefined();
    });

    it('replaces the stored color when a different color is chosen at the cursor', () => {
        const base = makeState(['hello'], 2, 2);
        const withStored = base.apply(
            base.tr.addStoredMark(color.create({[colorMarkName]: 'blue'})),
        );

        expect(storedColor(run(withStored, {color: 'red'}))).toBe('red');
    });

    it('applies the chosen color to the whole mixed selection', () => {
        const next = run(makeState([{text: 'AB', color: 'red'}, 'CD'], 0, 4), {color: 'red'});

        expect(colorValues(next)).toEqual(['red']);
    });

    it('removes the color from a fully covered selection', () => {
        const next = run(makeState([{text: 'ABC', color: 'red'}], 0, 3), {color: 'red'});

        expect(colorValues(next)).toEqual([undefined]);
    });

    it('replaces a fully covered selection with a different color', () => {
        const next = run(makeState([{text: 'ABC', color: 'blue'}], 0, 3), {color: 'red'});

        expect(colorValues(next)).toEqual(['red']);
    });

    it('exposes stored-mark state through isActive and meta', () => {
        const next = run(makeState(['hello'], 2, 2), {color: 'red'});

        expect(isActive(next)).toBe(true);
        expect(meta(next)).toBe('red');
    });
});
