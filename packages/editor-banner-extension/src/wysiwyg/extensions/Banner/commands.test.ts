import {history, undo} from '@gravity-ui/markdown-editor/pm/history';
import {type Node, Schema} from '@gravity-ui/markdown-editor/pm/model';
import {type Command, EditorState} from '@gravity-ui/markdown-editor/pm/state';
import {describe, expect, it} from 'vitest';

import {type RemovedParts, setBannerPart, toggleBannerPart} from './commands';
import {type BannerPart, type BannerPartSpec, bannerPartOrder} from './parts';

const testImage: BannerPartSpec = {part: 'image', create: (type) => type.create()};
const testTitle: BannerPartSpec = {
    part: 'title',
    create: (type) => type.create(null, type.schema.text('Title')),
};
const testContent: BannerPartSpec = {
    part: 'content',
    create: (type) => type.createAndFill(),
};

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        paragraph: {group: 'block', content: 'text*'},
        text: {},
        banner: {group: 'block', content: 'block+'},
        test_image: {group: 'block', atom: true, bannerPart: testImage},
        test_title: {group: 'block', content: 'text*', bannerPart: testTitle},
        test_content: {group: 'block', content: 'paragraph+', bannerPart: testContent},
    },
});

const partNodes: Record<BannerPart, string> = {
    image: 'test_image',
    title: 'test_title',
    content: 'test_content',
};

function createState(...children: Node[]) {
    const banner = schema.nodes.banner.create(null, children.length ? children : [p()]);
    return EditorState.create({
        schema,
        doc: schema.node('doc', null, [banner]),
        plugins: [history()],
    });
}

function p(text?: string) {
    return schema.nodes.paragraph.create(null, text ? schema.text(text) : null);
}

function title(text: string) {
    return schema.nodes.test_title.create(null, schema.text(text));
}

function run(state: EditorState, command: Command) {
    let next = state;
    const done = command(state, (tr) => {
        next = state.apply(tr);
    });
    return {done, state: next};
}

const childTypes = (state: EditorState) => {
    const types: string[] = [];
    state.doc.firstChild?.forEach((child) => types.push(child.type.name));
    return types;
};

const permutations = <T>(items: readonly T[]): T[][] =>
    items.length
        ? items.flatMap((item, index) =>
              permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [
                  item,
                  ...rest,
              ]),
          )
        : [[]];

describe('Banner part commands', () => {
    it.each(permutations(bannerPartOrder))(
        'should keep the part order when the switches go in the order %j',
        (...order) => {
            let state = createState();
            const enabled = new Set<BannerPart>();
            for (const part of order) {
                const result = run(state, setBannerPart(0, part, true));
                expect(result.done).toBe(true);
                state = result.state;
                enabled.add(part);
                expect(childTypes(state)).toEqual(
                    bannerPartOrder
                        .filter((name) => enabled.has(name))
                        .map((name) => partNodes[name]),
                );
            }
        },
    );

    it('should insert the image before the blocks of the banner', () => {
        const {state} = run(
            createState(title('Title'), p('Text')),
            setBannerPart(0, 'image', true),
        );
        expect(childTypes(state)).toEqual(['test_image', 'test_title', 'paragraph']);
    });

    it('should remove a part and keep the other blocks', () => {
        const {done, state} = run(
            createState(title('Title'), p('Text')),
            setBannerPart(0, 'title', false),
        );
        expect(done).toBe(true);
        expect(childTypes(state)).toEqual(['paragraph']);
        expect(state.doc.firstChild?.textContent).toBe('Text');
    });

    it('should replace the only part with an empty paragraph', () => {
        const {state} = run(createState(title('Title')), setBannerPart(0, 'title', false));
        expect(childTypes(state)).toEqual(['paragraph']);
        expect(state.doc.firstChild?.textContent).toBe('');
    });

    it('should reject a switch that does not change the banner', () => {
        const state = createState(title('Title'));
        expect(setBannerPart(0, 'title', true)(state)).toBe(false);
        expect(setBannerPart(0, 'image', false)(state)).toBe(false);
        expect(setBannerPart(1, 'image', true)(state)).toBe(false);
    });

    it('should restore the same node after the part is switched off and on', () => {
        const removed: RemovedParts = new Map();
        const edited = title('Edited title');
        let state = createState(schema.nodes.test_image.create(), edited, p('Text'));
        state = run(state, toggleBannerPart(0, 'title', false, removed)).state;
        expect(removed.get('title')).toBe(edited);
        state = run(state, toggleBannerPart(0, 'title', true, removed)).state;
        expect(childTypes(state)).toEqual(['test_image', 'test_title', 'paragraph']);
        expect(state.doc.firstChild?.child(1)).toBe(edited);
    });

    it('should undo each switch in one step', () => {
        let state = createState();
        state = run(state, setBannerPart(0, 'title', true)).state;
        state = run(state, setBannerPart(0, 'content', true)).state;
        state = run(state, setBannerPart(0, 'image', true)).state;
        state = run(state, undo).state;
        expect(childTypes(state)).toEqual(['test_title', 'test_content']);
        state = run(state, undo).state;
        expect(childTypes(state)).toEqual(['test_title']);
        state = run(state, undo).state;
        expect(childTypes(state)).toEqual(['paragraph']);
    });
});
