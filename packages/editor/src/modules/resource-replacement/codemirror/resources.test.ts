import {syntaxTreeAvailable} from '@codemirror/language';
import {EditorState} from '@codemirror/state';
import {FILE_TOKEN} from '@diplodoc/file-extension';
import MarkdownIt from 'markdown-it';
import {Schema} from 'prosemirror-model';

import {DirectiveSyntaxFacet} from '../../../markup/codemirror/directive-facet';
import {yfmLang} from '../../../markup/codemirror/yfm';
import {DirectiveSyntaxContext} from '../../../utils/directive';

import {fileResourceHandler, imageResourceHandler} from './builtins';
import {codeMirrorResourceSupport} from './handlers';
import {prepareMarkupResources} from './resources';

const schema = new Schema({
    nodes: {
        doc: {content: 'inline*'},
        text: {group: 'inline'},
        image: {
            group: 'inline',
            inline: true,
            attrs: {src: {}, alt: {default: ''}},
            resource: {kind: 'image', urlAttribute: 'src', nameAttribute: 'alt'},
        },
        [FILE_TOKEN]: {
            group: 'inline',
            inline: true,
            attrs: {href: {}, download: {}},
            resource: {kind: 'file', urlAttribute: 'href', nameAttribute: 'download'},
        },
    },
});
const urls = new MarkdownIt();
const options = {schema: () => schema, urls: () => urls};
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
    const prepared = prepareMarkupResources(
        state(
            '{% file src="/legacy.pdf" name="legacy" %}\n\n:file[directive](/directive.pdf)',
            mode,
        ),
        options,
    );
    expect(prepared.resources.map((resource) => resource.name)).toEqual(names);
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
    const prepared = prepareMarkupResources(state(source), options);
    expect(prepared.spans).toHaveLength(1);
    const span = prepared.spans[0];
    expect(source.slice(span.from, span.to)).toBe('/old.png');
    expect(source.slice(span.range.from, span.range.to)).toBe(source);
});

test('code and ordinary links do not become resources', () => {
    const source =
        '`![a](/inline.png)`\n\n```md\n![a](/fenced.png)\n```\n\n    ![a](/indented.png)\n\n##![a](/monospace.png)##\n\n[link](/link.png)';
    expect(prepareMarkupResources(state(source), options).resources).toEqual([]);
});

test('completes an unfinished CM tree before extracting distant resources', () => {
    const source = 'paragraph\n\n'.repeat(4000) + '![far][asset]\n\n[asset]: /far.png';
    const current = state(source);
    expect(syntaxTreeAvailable(current, current.doc.length)).toBe(false);
    const prepared = prepareMarkupResources(current, options);
    expect(prepared.resources).toEqual([{kind: 'image', path: '/far.png', name: 'far'}]);
    expect(prepared.occurrences).toHaveLength(1);
    expect(prepared.references[0].from).toBe(source.indexOf('![far]'));
});

test('an incremental edit to a reference definition updates its resource', () => {
    const current = state('![label][id]\n\n[id]: /old.png');
    expect(prepareMarkupResources(current, options).resources[0].path).toBe('/old.png');
    const from = current.doc.toString().indexOf('/old.png');
    const tr = current.update({changes: {from, to: from + 8, insert: '/new.png'}});
    expect(prepareMarkupResources(current, options, tr).resources[0].path).toBe('/new.png');
});

test('requires an explicit handler for a configured resource node', () => {
    const missing = new Schema({
        nodes: {
            doc: {content: 'text*'},
            text: {},
            video: {attrs: {src: {}}, resource: {kind: 'video', urlAttribute: 'src'}},
        },
    });
    expect(() =>
        prepareMarkupResources(state(':video[/old.mp4]'), {...options, schema: () => missing}),
    ).toThrow('No CodeMirror resource handler registered for node: video');
});

test('does not treat a label as the source URL when metadata selects a different attribute', () => {
    const different = new Schema({
        nodes: {
            doc: {content: 'inline*'},
            text: {group: 'inline'},
            image: {
                group: 'inline',
                inline: true,
                attrs: {src: {}, alt: {}},
                resource: {kind: 'image', urlAttribute: 'alt'},
            },
        },
    });
    expect(() =>
        prepareMarkupResources(state('![label](/old.png)'), {...options, schema: () => different}),
    ).toThrow('URL attribute: alt');
});
