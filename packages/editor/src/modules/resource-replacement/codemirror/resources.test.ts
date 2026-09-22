import {syntaxTreeAvailable} from '@codemirror/language';
import {EditorState} from '@codemirror/state';
import {FILE_TOKEN} from '@diplodoc/file-extension';

import {DirectiveSyntaxFacet} from '../../../markup/codemirror/directive-facet';
import {yfmLang} from '../../../markup/codemirror/yfm';
import {DirectiveSyntaxContext} from '../../../utils/directive';
import {resourceKey} from '../controller.utils';
import {defaultResourceUrls} from '../urls';

import {fileResourceHandler, imageResourceHandler} from './builtins';
import {collectInsertedMarkupResources, collectMarkupResources} from './collect-resources';
import {codeMirrorResourceSupport} from './handlers';
import {prepareResourceChanges} from './prepare-replacements';

const options = {
    resources: {
        image: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'},
        [FILE_TOKEN]: {kind: 'file', valueAttribute: 'href', nameAttribute: 'download'},
    },
};
function state(doc: string, mode: 'disabled' | 'enabled' | 'only' = 'enabled') {
    return EditorState.create({
        doc,
        extensions: [
            yfmLang(),
            DirectiveSyntaxFacet.of(new DirectiveSyntaxContext(mode)),
            codeMirrorResourceSupport(imageResourceHandler),
            codeMirrorResourceSupport(fileResourceHandler),
        ],
    });
}

test.each([
    ['disabled', ['legacy']],
    ['enabled', ['legacy', 'directive']],
    ['only', ['directive']],
] as const)('file syntax respects directive mode %s', (mode, names) => {
    const prepared = collectMarkupResources(
        state(
            '{% file src="/legacy.pdf" name="legacy" %}\n\n:file[directive](/directive.pdf)',
            mode,
        ),
        options,
    );
    expect(prepared.map((span) => span.resource.name)).toEqual(names);
});

test.each([
    '![a](/old.png)',
    '![a](</old.png> "title")',
    '![a](/old.png =100x200)',
    '![a](/old.png "title" =50%x200)',
    ':file[](/old.png "title")',
    ':file[a](/old.png)',
    '{% file src="/old.png" name="a" %}',
])('keeps both construction and URL ranges: %s', (source) => {
    const prepared = collectMarkupResources(state(source), options);
    expect(prepared).toHaveLength(1);
    const span = prepared[0];
    expect(source.slice(span.syntax.valueRange.from, span.syntax.valueRange.to)).toBe('/old.png');
    expect(source.slice(span.syntax.range.from, span.syntax.range.to)).toBe(source);
});

test('code and ordinary links do not become resources', () => {
    const source =
        '`![a](/inline.png)`\n\n```md\n![a](/fenced.png)\n```\n\n    ![a](/indented.png)\n\n##![a](/monospace.png)##\n\n[link](/link.png)';
    expect(collectMarkupResources(state(source), options)).toEqual([]);
});

test('insertion collection reads only the inserted resource in a large document', () => {
    const current = state('![existing](/old.png)\n\n'.repeat(200));
    const tr = current.update({changes: {from: current.doc.length, insert: '![new](/new.png)'}});
    const read = jest.spyOn(imageResourceHandler, 'read');
    try {
        expect(collectInsertedMarkupResources(tr, options).map(({resource}) => resource)).toEqual([
            {kind: 'image', value: '/new.png', name: 'new'},
        ]);
        expect(read).toHaveBeenCalledTimes(1);
    } finally {
        read.mockRestore();
    }
});

test.each([
    ['```md\n', '\n```'],
    ['`', '`'],
    ['![existing](', ')'],
    ['![', '](/outer.png)'],
])('insertion collection respects syntax outside the inserted range: %s', (before, after) => {
    const current = state(before + after);
    const tr = current.update({changes: {from: before.length, insert: '![new](/new.png)'}});
    expect(collectInsertedMarkupResources(tr, options)).toEqual([]);
});

test('insertion collection resolves definitions nested in block containers', () => {
    const source = '> ![new][id]\n>\n> [id]: /new.png';
    const tr = state('').update({changes: {from: 0, insert: source}});
    expect(collectInsertedMarkupResources(tr, options).map(({resource}) => resource)).toEqual([
        {kind: 'image', value: '/new.png', name: 'new'},
    ]);
});

test('empty resource configuration needs no language or document parse', () => {
    expect(
        collectMarkupResources(EditorState.create({doc: '![a](/a.png)'}), {resources: {}}),
    ).toEqual([]);
});

test('completes an unfinished CM tree before extracting distant resources', () => {
    const source = 'paragraph\n\n'.repeat(4000) + '![far][asset]\n\n[asset]: /far.png';
    const current = state(source);
    expect(syntaxTreeAvailable(current, current.doc.length)).toBe(false);
    const prepared = collectMarkupResources(current, options);
    expect(prepared).toHaveLength(1);
    expect(prepared[0].resource).toEqual({kind: 'image', value: '/far.png', name: 'far'});
    expect(prepared[0].syntax.range.from).toBe(source.indexOf('![far]'));
});

test('an edit to a reference definition updates its resource before the transaction is applied', () => {
    const current = state('![label][id]\n\n[id]: /old.png');
    expect(collectMarkupResources(current, options)[0].resource.value).toBe('/old.png');
    const from = current.doc.toString().indexOf('/old.png');
    const tr = current.update({changes: {from, to: from + 8, insert: '/new.png'}});
    expect(collectMarkupResources(current, options, tr)[0].resource.value).toBe('/new.png');
});

test('requires an explicit handler for a configured resource node', () => {
    const resources = {video: {kind: 'video', valueAttribute: 'src'}};
    expect(() => collectMarkupResources(state(':video[/old.mp4]'), {resources})).toThrow(
        'No CodeMirror resource handler registered for node: video',
    );
});

test('does not treat a label as the source URL when metadata selects a different attribute', () => {
    const resources = {image: {kind: 'image', valueAttribute: 'alt'}};
    expect(() => collectMarkupResources(state('![label](/old.png)'), {resources})).toThrow(
        'value attribute: alt',
    );
});

test('standalone integrations can supply URL rules without a document parser', () => {
    const urls = {
        normalizeLink: (value: string) =>
            defaultResourceUrls.normalizeLink(value.replace('/alias.png', '/actual.png')),
        validateLink: (value: string) =>
            defaultResourceUrls.validateLink(value) && !value.startsWith('/blocked'),
    };
    const current = state('![a](/alias.png) ![b](/blocked.png)');
    const configured = {
        ...options,
        urls,
    };
    const prepared = collectMarkupResources(current, configured);
    expect(prepared).toHaveLength(1);
    expect(prepared[0].resource.value).toBe('/actual.png');
    const key = resourceKey(prepared[0].resource);
    expect(prepareResourceChanges(current, new Map([[key, '/alias.png']]), configured)).toEqual([
        {...prepared[0].syntax.valueRange, insert: '/actual.png'},
    ]);
    expect(() =>
        prepareResourceChanges(current, new Map([[key, '/blocked.png']]), configured),
    ).toThrow('Invalid resource URL');
});

test('insertion collection preserves the order of reference and inline resources', () => {
    const tr = state('').update({
        changes: {
            from: 0,
            insert: '![reference][id] ![inline](/old.png)\n\n[id]: /old.png',
        },
    });
    expect(collectInsertedMarkupResources(tr, options).map(({resource}) => resource.name)).toEqual([
        'reference',
        'inline',
    ]);
});

test('replacement normalizes a new URL once and preserves reference label, title and definition', () => {
    const current = state('![inline](/old.png) ![ref][id]\n\n[id]: /old.png "ti&amp;tle"');
    const value = '/new file.png?x=1&y=2';
    const normalizeLink = jest.fn(defaultResourceUrls.normalizeLink);
    const changes = prepareResourceChanges(
        current,
        new Map([[resourceKey({kind: 'image', value: '/old.png'}), value]]),
        {...options, urls: {...defaultResourceUrls, normalizeLink}},
    );
    expect(normalizeLink.mock.calls.filter(([input]) => input === value)).toHaveLength(1);
    expect(current.update({changes}).newDoc.toString()).toBe(
        '![inline](/new%20file.png?x=1&amp;y=2) ![ref](/new%20file.png?x=1&amp;y=2 "ti&#38;tle")\n\n[id]: /old.png "ti&amp;tle"',
    );
});

test('one replacement escapes Markdown destinations but preserves literal file URLs', () => {
    const current = state('{% file src="/old.pdf" name="File" %}\n\n:file[File](/old.pdf)');
    const changes = prepareResourceChanges(
        current,
        new Map([[resourceKey({kind: 'file', value: '/old.pdf'}), '/new.pdf?x=1&y=2']]),
        options,
    );
    expect(current.update({changes}).newDoc.toString()).toBe(
        '{% file src="/new.pdf?x=1&y=2" name="File" %}\n\n:file[File](/new.pdf?x=1&amp;y=2)',
    );
});

// This custom syntax stores a JSON string, including its quotes, inside :asset[...].
const assetSupport = codeMirrorResourceSupport({
    nodeType: 'asset',
    valueAttribute: 'assetId',
    syntaxNodes: ['AssetResource'],
    syntax: {
        defineNodes: ['AssetResource'],
        parseInline: [
            {
                name: 'AssetResource',
                before: 'Link',
                parse(cx, next, pos) {
                    if (next !== 58) return -1;
                    const match = /^:asset\[("(?:[^"\\\r\n]|\\.)*")\]/.exec(cx.slice(pos, cx.end));
                    if (!match) return -1;
                    return cx.addElement(cx.elt('AssetResource', pos, pos + match[0].length));
                },
            },
        ],
    },
    read({node, doc}) {
        const valueRange = {from: node.from + 7, to: node.to - 1};
        return {
            range: {from: node.from, to: node.to},
            valueRange,
            attrs: {assetId: JSON.parse(doc.sliceString(valueRange.from, valueRange.to))},
            serialize(value) {
                if (value.includes('\0')) throw new Error('Unsupported asset value');
                return JSON.stringify(value);
            },
        };
    },
});
const assetOptions = {resources: {asset: {kind: 'image', valueAttribute: 'assetId'}}};
const assetSource = (value: string) => `:asset[${JSON.stringify(value)}]`;
function assetState(doc: string) {
    return EditorState.create({doc, extensions: [assetSupport, yfmLang()]});
}

test('opaque values bypass URL rules and round-trip through their own quoted syntax', () => {
    const oldValue = ' asset:ABC/123 &amp; %41 \\" ';
    const newValue = ' asset:XYZ/456 " ] \\ &amp; %20\nnext ';
    const current = assetState(
        `${assetSource(oldValue)} ${assetSource(oldValue.toLowerCase())} ${assetSource(oldValue)}`,
    );
    const forbidden = jest.fn(() => {
        throw new Error('URL codec called for an opaque value');
    });
    const configured = {...assetOptions, urls: {normalizeLink: forbidden, validateLink: forbidden}};
    expect(collectMarkupResources(current, configured).map(({resource}) => resource.value)).toEqual(
        [oldValue, oldValue.toLowerCase(), oldValue],
    );
    const changes = prepareResourceChanges(
        current,
        new Map([[resourceKey({kind: 'image', value: oldValue}), newValue]]),
        configured,
    );
    const updated = current.update({changes}).state;
    expect(collectMarkupResources(updated, configured).map(({resource}) => resource.value)).toEqual(
        [newValue, oldValue.toLowerCase(), newValue],
    );
    expect(forbidden).not.toHaveBeenCalled();
});

test('opaque replacements use original pairs without cascading and skip code', () => {
    const current = assetState(`${assetSource('A')} ${assetSource('B')} \`${assetSource('A')}\``);
    const changes = prepareResourceChanges(
        current,
        new Map([
            [resourceKey({kind: 'image', value: 'A'}), 'B'],
            [resourceKey({kind: 'image', value: 'B'}), 'C'],
        ]),
        assetOptions,
    );
    expect(current.update({changes}).newDoc.toString()).toBe(
        `${assetSource('B')} ${assetSource('C')} \`${assetSource('A')}\``,
    );
});

test('serialization failure prevents the whole set of source edits from being returned', () => {
    const source = `${assetSource('A')} ${assetSource('B')}`;
    const current = assetState(source);
    expect(() =>
        prepareResourceChanges(
            current,
            new Map([
                [resourceKey({kind: 'image', value: 'A'}), 'valid'],
                [resourceKey({kind: 'image', value: 'B'}), '\0'],
            ]),
            assetOptions,
        ),
    ).toThrow('Unsupported asset value');
    expect(current.doc.toString()).toBe(source);
});

test('the same kind/value can address a URL and an id without leaking URL normalization to the id', () => {
    const current = EditorState.create({
        doc: `![image](/old.png) ${assetSource('/old.png')}`,
        extensions: [assetSupport, codeMirrorResourceSupport(imageResourceHandler), yfmLang()],
    });
    const changes = prepareResourceChanges(
        current,
        new Map([[resourceKey({kind: 'image', value: '/old.png'}), '/new image.png']]),
        {resources: {...options.resources, ...assetOptions.resources, [FILE_TOKEN]: false}},
    );
    expect(current.update({changes}).newDoc.toString()).toBe(
        `![image](/new%20image.png) ${assetSource('/new image.png')}`,
    );
});

test('custom URL resources opt into URL preparation explicitly', () => {
    // eslint-disable-next-line no-script-url
    const invalidUrl = 'javascript:alert(1)';
    const current = assetState(assetSource('/old.png'));
    const configured = {
        resources: {asset: {...assetOptions.resources.asset, valueType: 'url' as const}},
    };
    const key = resourceKey({kind: 'image', value: '/old.png'});
    const changes = prepareResourceChanges(current, new Map([[key, '/new image.png']]), configured);
    expect(current.update({changes}).newDoc.toString()).toBe(assetSource('/new%20image.png'));
    expect(() => prepareResourceChanges(current, new Map([[key, invalidUrl]]), configured)).toThrow(
        'Invalid resource URL',
    );
});

test('still validates URL pairs from the request after their current matches disappear', () => {
    const key = resourceKey({kind: 'image', value: '/old.png'});
    // eslint-disable-next-line no-script-url
    const invalidUrl = 'javascript:alert(1)';
    expect(() =>
        prepareResourceChanges(
            state('text'),
            new Map([[key, invalidUrl]]),
            options,
            new Set([key]),
        ),
    ).toThrow('Invalid resource URL');
    expect(
        prepareResourceChanges(assetState('text'), new Map([[key, invalidUrl]]), assetOptions),
    ).toEqual([]);
});
