import {type Node, Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {describe, expect, test} from 'vitest';

import type {Parser} from '../../../core/types/parser';
import {ParserFacet} from '../../../core/utils/parser';
import {resourceKey} from '../../../modules/resource-replacement/controller.utils';
import {readNodeResource} from '../../../modules/resource-replacement/read-node-resource';
import {defaultResourceUrls} from '../../../modules/resource-replacement/tests/urls';

import {collectAddedRangesInFinalDocument, collectResourcesInRanges} from './collect-resources';
import {remoteTransactionMeta, resolvedResourceMeta, resourceHistoryKey} from './meta';
import {prepareResourceReplacementTransaction} from './prepare-replacements';
import type {ResourceBatch} from './types';
import {
    applyBatchMeta,
    isHistoryTransaction,
    isOriginalLocalDocumentChange,
    isSelectionInCode,
    mapBatchRanges,
} from './utils';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        paragraph: {group: 'block', content: 'inline*', toDOM: () => ['p', 0]},
        code_block: {group: 'block', content: 'inline*', code: true},
        text: {group: 'inline'},
        image: {
            group: 'inline',
            inline: true,
            attrs: {
                src: {default: '/old.png'},
                alt: {default: ''},
                width: {default: null},
                height: {default: null},
            },
            _resource: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'},
            toDOM: (node) => ['span', ['img', {src: node.attrs.src}]],
        },
        file: {
            group: 'inline',
            inline: true,
            attrs: {href: {default: '/old.png'}, name: {default: ''}},
            _resource: {
                kind: 'file',
                valueAttribute: 'href',
                nameAttribute: 'name',
                valueType: 'url',
            },
            toDOM: (node) => ['a', {href: node.attrs.href}, node.attrs.name],
        },
        resource: {
            group: 'inline',
            inline: true,
            content: 'text*',
            attrs: {url: {default: '/custom'}},
            _resource: {kind: 'custom', valueAttribute: 'url'},
        },
    },
    marks: {
        code: {code: true},
        strong: {},
        link: {attrs: {href: {default: '/old.png'}}},
    },
});
const {
    doc,
    paragraph: p,
    code_block: codeBlock,
    image,
    file,
    resource,
    code,
    strong,
    link,
} = builders(schema);
const parser: Parser = {
    ...defaultResourceUrls,
    parse: () => doc(p()),
    normalizeLinkText: (value) => value,
    matchLinks: () => null,
    isPunctChar: () => false,
};

function stateFor(document: Node) {
    return EditorState.create({schema, doc: document, plugins: [ParserFacet.of(parser)]});
}

function batch(from: number, to: number, id = 'first', started = false): ResourceBatch {
    return started ? {id, started} : {id, ranges: [{from, to}], started};
}

describe('tracking eligibility', () => {
    test('requires a document change', () => {
        const state = stateFor(doc(p('text')));
        expect(isOriginalLocalDocumentChange(state.tr)).toBe(false);
        expect(isOriginalLocalDocumentChange(state.tr.insertText('new', 1))).toBe(true);
        expect(isHistoryTransaction(state.tr)).toBe(false);
    });

    test.each(['appendedTransaction', resolvedResourceMeta, remoteTransactionMeta, 'rebased'])(
        'ignores document changes marked with %s',
        (meta) => {
            const tr = stateFor(doc(p())).tr.insertText('new', 1).setMeta(meta, true);
            expect(isOriginalLocalDocumentChange(tr)).toBe(false);
            expect(isHistoryTransaction(tr)).toBe(false);
        },
    );

    test('recognizes history replay and excludes it from tracking', () => {
        if (!resourceHistoryKey) throw new Error('Missing history plugin key');
        const tr = stateFor(doc(p())).tr.insertText('new', 1).setMeta(resourceHistoryKey, {});
        expect(isHistoryTransaction(tr)).toBe(true);
        expect(isOriginalLocalDocumentChange(tr)).toBe(false);
    });

    test('detects code blocks and inline code at the cursor', () => {
        for (const document of [doc(codeBlock('x<a>y')), doc(p(code('x<a>y')))]) {
            const state = stateFor(document);
            const selected = state.apply(
                state.tr.setSelection(TextSelection.create(state.doc, document.tag.a)),
            );
            expect(isSelectionInCode(selected)).toBe(true);
        }
        expect(isSelectionInCode(stateFor(doc(p('plain'))))).toBe(false);
    });

    test('explicit stored marks override marks at the cursor', () => {
        const document = doc(p(code('x<a>y')));
        const state = stateFor(document);
        const withoutCode = state.apply(
            state.tr
                .setSelection(TextSelection.create(state.doc, document.tag.a))
                .setStoredMarks([]),
        );
        expect(isSelectionInCode(withoutCode)).toBe(false);

        const plain = stateFor(doc(p('plain')));
        expect(
            isSelectionInCode(plain.apply(plain.tr.setStoredMarks([schema.marks.code.create()]))),
        ).toBe(true);
    });
});

describe('resource collection', () => {
    test('deduplicates overlapping ranges by position and returns document order', () => {
        const document = doc(p('<a>', image({alt: 'first'}), '<b>', image({alt: 'second'}), '<c>'));
        const state = stateFor(document);
        expect(
            collectResourcesInRanges(state, [
                {from: document.tag.b, to: document.tag.c},
                {from: document.tag.a, to: document.tag.c},
                {from: document.tag.a, to: document.tag.b},
            ]),
        ).toEqual([
            {
                from: document.tag.a,
                to: document.tag.b,
                resource: {kind: 'image', value: '/old.png', name: 'first'},
                isUrl: true,
            },
            {
                from: document.tag.b,
                to: document.tag.c,
                resource: {kind: 'image', value: '/old.png', name: 'second'},
                isUrl: true,
            },
        ]);
    });

    test('collects configured kinds but excludes code, links and invalid URL attributes', () => {
        const document = doc(
            p(image(), file({name: 'report'}), resource('custom'), link('link'), code(image())),
            codeBlock(image()),
            p(image({src: null})),
        );
        expect(
            collectResourcesInRanges(stateFor(document), [
                {from: 0, to: document.content.size},
            ]).map((item) => item.resource),
        ).toEqual([
            {kind: 'image', value: '/old.png'},
            {kind: 'file', value: '/old.png', name: 'report'},
            {kind: 'custom', value: '/custom'},
        ]);
    });

    test('requires the whole resource node to fit inside a range', () => {
        const document = doc(p('<a>', resource('label'), '<b>'));
        const state = stateFor(document);
        expect(
            collectResourcesInRanges(state, [{from: document.tag.a + 1, to: document.tag.b}]),
        ).toEqual([]);
        expect(
            collectResourcesInRanges(state, [{from: document.tag.a, to: document.tag.b - 1}]),
        ).toEqual([]);
        expect(
            collectResourcesInRanges(state, [{from: document.tag.a, to: document.tag.b}]),
        ).toHaveLength(1);
    });

    test.each(['', null, 42])('omits a resource name when it is %p', (alt) => {
        const document = doc(p(image({alt})));
        expect(
            collectResourcesInRanges(stateFor(document), [{from: 1, to: 2}])[0].resource,
        ).toEqual({kind: 'image', value: '/old.png'});
    });

    test('reads only configured nodes with string values', () => {
        expect(readNodeResource(file({href: '/file'}), parser)).toEqual({
            resource: {kind: 'file', value: '/file'},
            isUrl: true,
        });
        expect(readNodeResource(image({src: 42}), parser)).toBeUndefined();
        expect(readNodeResource(p('text'), parser)).toBeUndefined();
    });
});

describe('batch state and added ranges', () => {
    test('maps boundaries without absorbing adjacent insertions or mutating stored batches', () => {
        const state = stateFor(doc(p(image(), image())));
        const batches = [batch(1, 2), batch(2, 3, 'second', false)];
        const tr = state.tr.insertText('left', 1).insertText('right', 6);
        expect(mapBatchRanges(batches, tr)).toEqual([batch(5, 6), batch(11, 12, 'second', false)]);
        expect(batches).toEqual([batch(1, 2), batch(2, 3, 'second', false)]);
    });

    test('drops collapsed ranges while preserving the other ranges and batch identity', () => {
        const state = stateFor(doc(p(image(), image())));
        const batches = [batch(1, 2), batch(2, 3, 'second')];
        expect(mapBatchRanges(batches, state.tr.delete(1, 2))).toEqual([
            {id: 'first', ranges: [], started: false},
            batch(1, 2, 'second'),
        ]);
    });

    test('start and release affect only the selected batch without mutating the input', () => {
        const batches = [batch(1, 2, 'first', false), batch(2, 3, 'second', false)];
        const started = applyBatchMeta(batches, {type: 'start', id: 'second'});
        expect(started).toEqual([batch(1, 2, 'first', false), {id: 'second', started: true}]);
        expect(applyBatchMeta(started, {type: 'release', id: 'second'})).toEqual([batches[0]]);
        expect(batches).toEqual([batch(1, 2, 'first', false), batch(2, 3, 'second', false)]);
        expect(applyBatchMeta(batches)).toBe(batches);
        expect(applyBatchMeta(batches, {type: 'release', id: 'missing'})).toEqual(batches);
    });

    test('running operations have no positions to map after request preparation', () => {
        const state = stateFor(doc(p(image(), image())));
        const running: ResourceBatch = {id: 'running', started: true};
        const mapped = mapBatchRanges([running, batch(2, 3)], state.tr.insertText('prefix', 1));
        expect(mapped[0]).toBe(running);
        expect(mapped[1]).toEqual(batch(8, 9));
    });

    test('collects added content in final coordinates across multiple steps', () => {
        const state = stateFor(doc(p('ab')));
        const tr = state.tr.insert(3, image()).insertText('xy', 1).insert(3, file());
        expect(tr.doc).toMatchNode(doc(p('xy', file(), 'ab', image())));
        const ranges = collectAddedRangesInFinalDocument(tr);
        expect(ranges).toEqual([
            {from: 6, to: 7},
            {from: 3, to: 4},
        ]);
        expect(collectResourcesInRanges(state.apply(tr), ranges)).toEqual([
            {from: 3, to: 4, resource: {kind: 'file', value: '/old.png'}, isUrl: true},
            {from: 6, to: 7, resource: {kind: 'image', value: '/old.png'}, isUrl: true},
        ]);
    });

    test('does not collect resources removed by a later step', () => {
        const state = stateFor(doc(p('ab')));
        const tr = state.tr.insert(3, image()).delete(3, 4);
        expect(
            collectResourcesInRanges(state.apply(tr), collectAddedRangesInFinalDocument(tr)),
        ).toEqual([]);
        expect(collectAddedRangesInFinalDocument(state.tr.delete(1, 2))).toEqual([]);
    });

    test('includes replacement content but ignores attribute-only steps', () => {
        const state = stateFor(doc(p('ab')));
        const tr = state.tr.replaceWith(1, 3, image()).setNodeAttribute(1, 'alt', 'new');
        expect(collectAddedRangesInFinalDocument(tr)).toEqual([{from: 1, to: 2}]);
    });
});

describe('replacement transactions', () => {
    test('replaces all current kind/value matches, preserves other attributes and skips code', () => {
        const document = doc(
            p(
                image({alt: 'first', width: 120}),
                strong(image({alt: 'second'})),
                file(),
                link('link'),
            ),
            p(code(image())),
            codeBlock(image()),
        );
        const state = stateFor(document);
        const tr = prepareResourceReplacementTransaction(
            state,
            new Map([[resourceKey({kind: 'image', value: '/old.png'}), '/new.png']]),
        );
        expect(tr?.doc).toMatchNode(
            doc(
                p(
                    image({src: '/new.png', alt: 'first', width: 120}),
                    strong(image({src: '/new.png', alt: 'second'})),
                    file(),
                    link('link'),
                ),
                p(code(image())),
                codeBlock(image()),
            ),
        );
        expect(tr?.getMeta('addToHistory')).toBe(false);
        expect(tr?.getMeta(resolvedResourceMeta)).toBe(true);
        expect(state.doc).toBe(document);
    });

    test('uses configured URL attributes and does not cascade replacements', () => {
        const state = stateFor(
            doc(p(image(), image({src: '/new.png'}), file(), resource('label'))),
        );
        const tr = prepareResourceReplacementTransaction(
            state,
            new Map([
                [resourceKey({kind: 'image', value: '/old.png'}), '/new.png'],
                [resourceKey({kind: 'image', value: '/new.png'}), '/final.png'],
                [resourceKey({kind: 'file', value: '/old.png'}), '/new.pdf'],
                [resourceKey({kind: 'custom', value: '/custom'}), '/new-custom'],
            ]),
        );
        expect(tr?.doc).toMatchNode(
            doc(
                p(
                    image({src: '/new.png'}),
                    image({src: '/final.png'}),
                    file({href: '/new.pdf'}),
                    resource({url: '/new-custom'}, 'label'),
                ),
            ),
        );
    });

    test.each([
        {name: 'empty response', replacements: new Map<string, string>()},
        {
            name: 'no matching resource',
            replacements: new Map([[resourceKey({kind: 'image', value: '/missing'}), '/new.png']]),
        },
        {
            name: 'unchanged URL',
            replacements: new Map([[resourceKey({kind: 'image', value: '/old.png'}), '/old.png']]),
        },
    ])('returns null for $name', ({replacements}) => {
        expect(
            prepareResourceReplacementTransaction(stateFor(doc(p(image()))), replacements),
        ).toBeNull();
    });

    test('encodes replacement URLs and rejects an invalid response atomically', () => {
        const state = stateFor(doc(p(image(), file())));
        const encoded = prepareResourceReplacementTransaction(
            state,
            new Map([[resourceKey({kind: 'image', value: '/old.png'}), '/a b.png']]),
        );
        expect(encoded?.doc.nodeAt(1)?.attrs.src).toBe('/a%20b.png');
        const replacements = new Map([
            [resourceKey({kind: 'image', value: '/old.png'}), '/valid.png'],
            // eslint-disable-next-line no-script-url
            [resourceKey({kind: 'file', value: '/old.png'}), 'javascript:alert(1)'],
        ]);
        expect(() => prepareResourceReplacementTransaction(state, replacements)).toThrow(
            'Invalid resource URL',
        );
        expect(state.doc).toMatchNode(doc(p(image(), file())));
    });
});

test('custom identifiers remain exact even with a URL-like attribute and application kind', () => {
    const oldValue = ' asset:ABC/123 &amp; %41 \\" ';
    const newValue = ' asset:XYZ/456 " \\ &amp; %20\n ';
    const customSchema = new Schema({
        nodes: {
            doc: {content: 'asset*'},
            text: {},
            asset: {
                attrs: {src: {}, title: {default: 'Scheme'}},
                _resource: {kind: 'image', valueAttribute: 'src', nameAttribute: 'title'},
            },
        },
    });
    const asset = (src: string) => customSchema.nodes.asset.create({src});
    const state = EditorState.create({
        schema: customSchema,
        doc: customSchema.nodes.doc.create(null, [
            asset(oldValue),
            asset(oldValue.toLowerCase()),
            asset(oldValue),
        ]),
    });
    expect(
        collectResourcesInRanges(state, [{from: 0, to: state.doc.content.size}]).map(
            (item) => item.resource,
        ),
    ).toEqual([
        {kind: 'image', value: oldValue, name: 'Scheme'},
        {kind: 'image', value: oldValue.toLowerCase(), name: 'Scheme'},
        {kind: 'image', value: oldValue, name: 'Scheme'},
    ]);
    const tr = prepareResourceReplacementTransaction(
        state,
        new Map([[resourceKey({kind: 'image', value: oldValue}), newValue]]),
    );
    expect(tr?.doc.child(0).attrs).toEqual({src: newValue, title: 'Scheme'});
    expect(tr?.doc.child(1).attrs.src).toBe(oldValue.toLowerCase());
    expect(tr?.doc.child(2).attrs.src).toBe(newValue);
});

test('URL preparation cannot leak between an image and an opaque id with the same kind/value', () => {
    const mixedSchema = new Schema({
        nodes: {
            doc: {content: '(image | asset)*'},
            text: {},
            image: {attrs: {src: {}}, _resource: {kind: 'asset', valueAttribute: 'src'}},
            asset: {attrs: {src: {}}, _resource: {kind: 'asset', valueAttribute: 'src'}},
        },
    });
    const state = EditorState.create({
        schema: mixedSchema,
        plugins: [ParserFacet.of(parser)],
        doc: mixedSchema.nodes.doc.create(null, [
            mixedSchema.nodes.image.create({src: '/old.png'}),
            mixedSchema.nodes.asset.create({src: '/old.png'}),
        ]),
    });
    const tr = prepareResourceReplacementTransaction(
        state,
        new Map([[resourceKey({kind: 'asset', value: '/old.png'}), '/new image.png']]),
    );
    expect(tr?.doc.child(0).attrs.src).toBe('/new%20image.png');
    expect(tr?.doc.child(1).attrs.src).toBe('/new image.png');
});

test('validates original URL pairs even when another operation removed all current matches', () => {
    const key = resourceKey({kind: 'image', value: '/old.png'});
    // eslint-disable-next-line no-script-url
    const invalidUrl = 'javascript:alert(1)';
    const state = stateFor(doc(p('text')));
    expect(() =>
        prepareResourceReplacementTransaction(state, new Map([[key, invalidUrl]]), new Set([key])),
    ).toThrow('Invalid resource URL');
    expect(prepareResourceReplacementTransaction(state, new Map([[key, invalidUrl]]))).toBeNull();
});
