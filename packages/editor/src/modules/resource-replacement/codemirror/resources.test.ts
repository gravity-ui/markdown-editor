import {EditorState} from '@codemirror/state';
import {FILE_TOKEN} from '@diplodoc/file-extension';

import {BundlePreset} from '../../../bundle/wysiwyg-preset';
import {type Extension, createEditorExtensions} from '../../../core';
import {ReactRenderStorage} from '../../../extensions';
import {DirectiveSyntaxContext} from '../../../utils/directive';
import {resourceKey} from '../controller.utils';
import {
    type ResourceMarkdownOptions,
    collectMarkdownResources,
    replaceMarkdownResources,
} from '../markdown';

import {collectInsertedMarkupResources} from './collect-resources';
import {textChanges} from './prepare-replacements';

function options(extra?: Extension): ResourceMarkdownOptions {
    const {markupParser: parser, serializer} = createEditorExtensions({
        extensions(builder) {
            builder.use(BundlePreset, {
                preset: 'full',
                searchPanel: false,
                directiveSyntax: new DirectiveSyntaxContext('enabled'),
                reactRenderer: new ReactRenderStorage(),
            });
            if (extra) builder.use(extra);
        },
    }).buildDeps();
    return {
        parser,
        serializer,
        resources: {
            image: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'},
            [FILE_TOKEN]: {kind: 'file', valueAttribute: 'href', nameAttribute: 'download'},
        },
    };
}
const replacements = (oldValue = '/old.png', newValue = '/new.png', kind = 'image') =>
    new Map([[resourceKey({kind, value: oldValue}), newValue]]);

test.each([
    '![a](/old.png)',
    '![a](</old.png> "title")',
    '![a](/old.png "title" =100x200)',
    ':file[a](/old.png)',
    '{% file src="/old.png" name="a" %}',
    '![a][ref]\n\n[ref]: /old.png',
])('collects configured nodes using the Markdown parser: %s', (source) => {
    expect(collectMarkdownResources(source, options()).map(({resource}) => resource.value)).toEqual(
        ['/old.png'],
    );
});

test('code nodes, code marks and ordinary links are excluded', () => {
    expect(
        collectMarkdownResources(
            '`![a](/inline)`\n\n```md\n![a](/fenced)\n```\n\n    ![a](/indented)\n\n##![a](/mono)##\n\n[link](/link)',
            options(),
        ),
    ).toEqual([]);
});

test('independent insertions cannot combine into a new Markdown construct', () => {
    const tr = EditorState.create({doc: 'separator'}).update({
        changes: [
            {from: 0, insert: '![label]('},
            {from: 9, insert: '/old.png)'},
        ],
    });
    expect(collectInsertedMarkupResources(tr, options())).toEqual([]);
});

test('fragment collection is approximate and does not read surrounding code or definitions', () => {
    const config = options();
    const tr = EditorState.create({doc: '```\n\n```'}).update({
        changes: {from: 4, insert: '![a](/old.png)'},
    });
    expect(collectInsertedMarkupResources(tr, config)).toHaveLength(1);
    expect(replaceMarkdownResources(tr.newDoc.toString(), replacements(), config)).toBeUndefined();
    const reference = EditorState.create({doc: '[ref]: /old.png\n\n'}).update({
        changes: {from: 17, insert: '![a][ref]'},
    });
    expect(collectInsertedMarkupResources(reference, config)).toEqual([]);
});

test('replacement is global, preserves attributes, and skips links and code', () => {
    const config = options();
    const source =
        '![a](/old.png "title" =100x200) ![b](/old.png) [link](/old.png) `![code](/old.png)`';
    const result = replaceMarkdownResources(source, replacements(), config)!;
    const images: Record<string, unknown>[] = [];
    config.parser.parse(result).descendants((node) => {
        if (node.type.name === 'image') images.push({...node.attrs});
    });
    expect(images).toEqual([
        expect.objectContaining({
            src: '/new.png',
            alt: 'a',
            title: 'title',
            width: '100',
            height: '200',
        }),
        expect.objectContaining({src: '/new.png', alt: 'b'}),
    ]);
    expect(result).toContain('[link](/old.png)');
    expect(result).toContain('`![code](/old.png)`');
});

test('empty, unchanged and absent replacements do not serialize or reformat the source', () => {
    const config = options();
    const serialize = jest.spyOn(config.serializer, 'serialize');
    const source = '#   title\n\n![a](/old.png)';
    expect(replaceMarkdownResources(source, new Map(), config)).toBeUndefined();
    expect(
        replaceMarkdownResources(source, replacements('/old.png', '/old.png'), config),
    ).toBeUndefined();
    expect(replaceMarkdownResources(source, replacements('/absent'), config)).toBeUndefined();
    expect(serialize).not.toHaveBeenCalled();
});

test('one response does not cascade', () => {
    const config = options();
    const changes = new Map([...replacements('/one', '/two'), ...replacements('/two', '/three')]);
    const result = replaceMarkdownResources('![a](/one) ![b](/two)', changes, config)!;
    expect(collectMarkdownResources(result, config).map(({resource}) => resource.value)).toEqual([
        '/two',
        '/three',
    ]);
});

test('all requested URLs are validated even when their nodes were deleted', () => {
    const config = options();
    const changes = replacements('/old.png', 'javascript:bad'); // eslint-disable-line no-script-url
    expect(() =>
        replaceMarkdownResources('deleted', changes, config, new Set(changes.keys())),
    ).toThrow('Invalid resource URL');
});

const asset: Extension = (builder) => {
    builder.configureMd((md) => {
        md.inline.ruler.before('text', 'asset', (state, silent) => {
            const match = /^:asset\[("(?:[^"\\]|\\.)*")\]/.exec(state.src.slice(state.pos));
            if (!match) return false;
            if (!silent) state.push('asset', '', 0).attrSet('assetId', JSON.parse(match[1]));
            state.pos += match[0].length;
            return true;
        });
        return md;
    });
    builder.addNode('asset', () => ({
        spec: {inline: true, group: 'inline', atom: true, attrs: {assetId: {}}},
        fromMd: {
            tokenSpec: {
                name: 'asset',
                type: 'node',
                getAttrs: (token) => ({assetId: token.attrGet('assetId')}),
            },
        },
        toMd: (state, node) => state.write(`:asset[${JSON.stringify(node.attrs.assetId)}]`),
    }));
};

test('extension specs support opaque IDs without a CodeMirror handler or URL normalization', () => {
    const config = options(asset);
    config.resources = {asset: {kind: 'asset', valueAttribute: 'assetId'}};
    const before = '  A&B/Ж  ';
    const after = '  B"\\&copy;  ';
    const source = `:asset[${JSON.stringify(before)}]`;
    const result = replaceMarkdownResources(source, replacements(before, after, 'asset'), config)!;
    expect(collectMarkdownResources(result, config)).toEqual([
        {resource: {kind: 'asset', value: after}, isUrl: false},
    ]);
});

test('the same kind/value can address a URL and an opaque ID', () => {
    const config = options(asset);
    config.resources = {...config.resources, asset: {kind: 'image', valueAttribute: 'assetId'}};
    const result = replaceMarkdownResources(
        '![a](/old.png) :asset["/old.png"]',
        replacements('/old.png', '/new image.png'),
        config,
    )!;
    expect(collectMarkdownResources(result, config).map(({resource}) => resource.value)).toEqual([
        '/new%20image.png',
        '/new image.png',
    ]);
});

test.each([
    ['prefix old middle old suffix', 'prefix new middle new suffix', 7, 21],
    ['same', 'same', undefined, undefined],
    ['', 'new', 0, 0],
    ['old', '', 0, 3],
    ['a😀z', 'a😁z', 1, 3],
    ['a😀z', 'a🨀z', 1, 3],
])('text replacement preserves common edges: %s → %s', (before, after, from, to) => {
    const changes = textChanges(before, after);
    const state = EditorState.create({doc: before});
    expect(state.update({changes}).newDoc.toString()).toBe(after);
    if (from === undefined) expect(changes).toEqual([]);
    else
        expect(changes).toEqual([
            {from, to, insert: after.slice(from, after.length - (before.length - to!))},
        ]);
});
