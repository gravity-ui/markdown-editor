import {Schema} from 'prosemirror-model';
import {builders} from 'prosemirror-test-builder';

import {trimListItems} from './utils';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {group: 'block', content: 'text*', toDOM: () => ['p', 0]},
        bullet_list: {content: 'list_item+', group: 'block'},
        ordered_list: {content: 'list_item+', group: 'block'},
        list_item: {content: 'block+'},
    },
    marks: {},
});

const {doc, paragraph: p} = builders(schema);
const bulletList = builders(schema)['bullet_list'];
const orderedList = builders(schema)['ordered_list'];
const listItem = builders(schema)['list_item'];

describe('trimListItems', () => {
    it('removes empty list items at the start and end of a bullet list', () => {
        const fragment = doc(
            bulletList(listItem(), listItem(p('11')), listItem(p('22')), listItem()),
        ).content;

        const trimmedFragment = trimListItems(fragment);
        expect(schema.nodes.doc.create(null, trimmedFragment)).toMatchNode(
            doc(bulletList(listItem(p('11')), listItem(p('22')))),
        );
    });

    it('removes empty list items at the start and end of an ordered list', () => {
        const fragment = doc(
            orderedList(listItem(), listItem(p('11')), listItem(p('22')), listItem()),
        ).content;

        const trimmedFragment = trimListItems(fragment);
        expect(schema.nodes.doc.create(null, trimmedFragment)).toMatchNode(
            doc(orderedList(listItem(p('11')), listItem(p('22')))),
        );
    });

    it('removes only empty list items at the start and end, keeping empty ones in the middle', () => {
        const fragment = doc(
            bulletList(listItem(), listItem(p('11')), listItem(), listItem(p('22')), listItem()),
        ).content;

        const trimmedFragment = trimListItems(fragment);
        expect(schema.nodes.doc.create(null, trimmedFragment)).toMatchNode(
            doc(bulletList(listItem(p('11')), listItem(), listItem(p('22')))),
        );
    });

    it('does not modify a list with no empty items', () => {
        const fragment = doc(bulletList(listItem(p('11')), listItem(p('22')))).content;

        const trimmedFragment = trimListItems(fragment);
        expect(schema.nodes.doc.create(null, trimmedFragment)).toMatchNode(
            doc(bulletList(listItem(p('11')), listItem(p('22')))),
        );
    });

    it('trims a list to one empty list item if it contains only empty list items', () => {
        const fragment = doc(bulletList(listItem(), listItem(), listItem())).content;

        const trimmedFragment = trimListItems(fragment);
        expect(schema.nodes.doc.create(null, trimmedFragment)).toMatchNode(
            doc(bulletList(listItem())),
        );
    });

    it('correctly handles multiple lists in a single fragment', () => {
        const fragment = doc(
            bulletList(listItem(), listItem(p('11')), listItem(), listItem(p('22')), listItem()),
            orderedList(listItem(), listItem(p('A')), listItem(p('B')), listItem()),
        ).content;

        const trimmedFragment = trimListItems(fragment);
        expect(schema.nodes.doc.create(null, trimmedFragment)).toMatchNode(
            doc(
                bulletList(listItem(p('11')), listItem(), listItem(p('22'))),
                orderedList(listItem(p('A')), listItem(p('B'))),
            ),
        );
    });

    it('does not modify paragraphs and other nodes outside lists', () => {
        const fragment = doc(
            p('Some text'),
            bulletList(listItem(), listItem(p('11')), listItem(p('22')), listItem()),
            p('More text'),
        ).content;

        const trimmedFragment = trimListItems(fragment);
        expect(schema.nodes.doc.create(null, trimmedFragment)).toMatchNode(
            doc(p('Some text'), bulletList(listItem(p('11')), listItem(p('22'))), p('More text')),
        );
    });
});
