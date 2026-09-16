import {Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';

import {YfmHtmlConstructorConsts} from '../YfmHtmlConstructorSpecs/const';
import {emptyHtmlConstructorStructure, readBlocks, readStructure} from '../model';

import {useConstructorCommands} from './useConstructorCommands';

const entityId = YfmHtmlConstructorConsts.NodeAttrs.EntityId;
const schema = new Schema({
    nodes: {
        doc: {content: 'constructor*'},
        text: {},
        constructor: {
            atom: true,
            attrs: {
                structure: {default: emptyHtmlConstructorStructure()},
                blocks: {default: []},
                [entityId]: {default: 'constructor#original'},
            },
            toDOM: () => ['div'],
        },
    },
});
const environment = globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT?: boolean};
const previousActEnvironment = environment.IS_REACT_ACT_ENVIRONMENT;
let host: HTMLDivElement;
let root: Root;
let view: EditorView;
let commands: ReturnType<typeof useConstructorCommands>;
let position: number | undefined;
const getPos = () => position;
const onChange = (attrs: Record<string, unknown>) => {
    const node = view.state.doc.nodeAt(position!);
    view.dispatch(view.state.tr.setNodeMarkup(position!, undefined, {...node?.attrs, ...attrs}));
};
const Probe = () => {
    commands = useConstructorCommands({nodeType: schema.nodes.constructor, getPos, view, onChange});
    return null;
};
const block = (id: string) => ({id, content: `<p>${id}</p>`, css: '& {color: red}', themeIds: []});

beforeAll(() => {
    environment.IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
    environment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});
beforeEach(() => {
    position = 0;
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    view = new EditorView(document.createElement('div'), {
        state: EditorState.create({
            schema,
            doc: schema.nodes.doc.create(
                null,
                schema.nodes.constructor.create({blocks: [block('first')]}),
            ),
        }),
    });
    act(() => root.render(<Probe />));
});
afterEach(() => {
    act(() => root.unmount());
    view.destroy();
    host.remove();
});

it('keeps command identities and edits the latest document after an external change', () => {
    const original = commands;
    onChange({blocks: [block('first'), block('external')]});
    act(() => root.render(<Probe />));
    expect(commands).toBe(original);
    commands.patchBlock('first', {content: '<p>Edited</p>'});
    const blocks = readBlocks(view.state.doc.firstChild!);
    expect(blocks.map(({id}) => id)).toEqual(['first', 'external']);
    expect(blocks[0]).toMatchObject({content: '<p>Edited</p>', css: '& {color: red}'});
    expect(blocks[1]).toEqual(block('external'));
});

it('applies consecutive changes without waiting for a React render', () => {
    commands.addBlock(block('second'));
    commands.patchStructure({content: '<h1>Intro</h1>'});
    commands.patchBlock('second', {content: '<p>Updated second</p>'});
    const node = view.state.doc.firstChild!;
    expect(readStructure(node).content).toBe('<h1>Intro</h1>');
    expect(readBlocks(node)[1].content).toBe('<p>Updated second</p>');
});

it('preserves block CSS on an HTML edit and replaces it on a combined CSS edit', () => {
    commands.commitCode({html: '<div class="g-md-hc-block g-md-hc-block-1"><p>Edited</p></div>'});
    expect(readBlocks(view.state.doc.firstChild!)[0]).toMatchObject({
        id: 'first',
        css: '& {color: red}',
    });
    onChange({blocks: [...readBlocks(view.state.doc.firstChild!), block('external')]});
    commands.commitCode({css: '.g-md-hc-block {color: blue}'});
    const node = view.state.doc.firstChild!;
    expect(readStructure(node).css).toBe('.g-md-hc-block {color: blue}');
    expect(readBlocks(node).map(({css}) => css)).toEqual(['', '']);
    expect(readBlocks(node)[0].content).toBe('<p>Edited</p>');
});

it('duplicates the current node with independent block and entity IDs', () => {
    commands.addBlock(block('external'));
    commands.duplicate();
    const original = view.state.doc.child(0);
    const copy = view.state.doc.child(1);
    expect(copy.attrs[entityId]).not.toBe(original.attrs[entityId]);
    expect(readBlocks(copy).map(({content}) => content)).toEqual(
        readBlocks(original).map(({content}) => content),
    );
    expect(readBlocks(copy).map(({id}) => id)).not.toEqual(readBlocks(original).map(({id}) => id));
});

it('ignores retained commands after the constructor is removed', () => {
    commands.remove();
    position = undefined;
    const dispatch = jest.spyOn(view, 'dispatch');
    commands.patchStructure({content: 'Detached'});
    commands.addBlock(block('late'));
    commands.duplicate();
    commands.remove();
    expect(dispatch).not.toHaveBeenCalled();
    expect(view.state.doc.childCount).toBe(0);
});
