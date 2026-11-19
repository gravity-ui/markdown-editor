import {DOMParser, type ParseOptions, type Slice} from 'prosemirror-model';
import {EditorState, Plugin, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {type ExtensionDeps, ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {ReactRendererExtension} from 'src/extensions/behavior/ReactRenderer';
import {Bold, boldMarkName} from 'src/extensions/markdown/Bold';
import {YfmTable, YfmTableNode} from 'src/extensions/yfm/YfmTable';
import {ReactRenderStorage} from 'src/modules/react-renderer';

import {ClipboardEventMock, DataTransferMock} from '../../../../tests/event-mock';
import {readValidMatrixSlice} from '../../../../tests/utils';

import {Table} from './index';

const views: EditorView[] = [];
beforeEach(() => vi.stubGlobal('ClipboardEvent', ClipboardEventMock));
afterEach(() => {
    views.splice(0).forEach((view) => view.destroy());
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('Markdown table HTML paste', () => {
    it('should retain one body row through the selected parser and transforms once', () => {
        let parses = 0;
        let transforms = 0;
        class UserParser extends DOMParser {
            parseSlice(dom: Parameters<DOMParser['parseSlice']>[0], options: ParseOptions = {}) {
                parses++;
                return super.parseSlice(dom, options);
            }
        }
        const {paste} = createView({
            extra: ({schema}) =>
                new Plugin({
                    props: {
                        clipboardParser: new UserParser(schema, DOMParser.fromSchema(schema).rules),
                        transformPastedHTML: (html) => html.replace('original', 'changed'),
                        transformPasted(slice) {
                            transforms++;
                            return slice;
                        },
                    },
                }),
        });

        const slice = paste('<table><tr><td>original</td><td>B</td></tr></table>');

        expect(slice.content.firstChild!.type.name).toBe('tbody');
        expect(texts(slice)).toEqual(['changed', 'B']);
        expect(parses).toBe(1);
        expect(transforms).toBe(1);
    });

    it('should preserve header roles across row groups and keep only one Markdown header', () => {
        const {paste} = createView();
        const slice = paste(
            '<table><thead><tr><td>H</td></tr><tr><th>J</th></tr></thead><tbody><tr><td>A</td></tr></tbody><tbody><tr><td>B</td></tr></tbody><tfoot><tr><td>F</td></tr></tfoot></table>',
        );

        expect(texts(slice)).toEqual(['H', 'J', 'A', 'B', 'F']);
        expect(readValidMatrixSlice(slice)!.headerRows).toBe(1);
    });

    it('should expand spans positionally and keep each owner text once', () => {
        const {paste} = createView();
        const slice = paste(
            '<table><tr><td rowspan="2">A</td><td colspan="2">B</td></tr><tr><td>C</td><td>D</td></tr></table>',
        );

        expect(texts(slice)).toEqual(['A', 'B', '', '', 'C', 'D']);
        expect(readValidMatrixSlice(slice)!.width).toBe(3);
    });

    it('should limit a zero rowspan to its own row group', () => {
        const {paste} = createView();
        const slice = paste(
            '<table><thead><tr><th rowspan="0">H</th><th>J</th></tr><tr><th>K</th></tr></thead><tbody><tr><td>A</td><td>B</td></tr></tbody></table>',
        );

        expect(texts(slice)).toEqual(['H', 'J', '', 'K', 'A', 'B']);
    });

    it('should flatten blocks and nested tables with spaces while retaining inline marks', () => {
        const {paste} = createView();
        const slice = paste(
            '<table><tr><td><p><strong>A</strong></p><ul><li>B</li><li>C</li></ul><table><tr><td>D</td></tr></table>TAIL</td></tr></table>',
        );
        const source = readValidMatrixSlice(slice)!;

        expect(texts(slice)).toEqual(['A B C D TAIL']);
        expect(source.cells[0].content.firstChild!.marks[0].type.name).toBe(boldMarkName);
    });

    it('should keep large spans bounded by falling back to real cells', () => {
        const {paste} = createView();
        const slice = paste(
            `<table><tr><td colspan="1000" rowspan="20">A</td></tr>${'<tr></tr>'.repeat(19)}</table>`,
        );
        const source = readValidMatrixSlice(slice)!;

        expect([source.width, source.height]).toEqual([1, 20]);
        expect(texts(slice).filter(Boolean)).toEqual(['A']);
    });

    it.each([
        '<p>before</p><table><tr><td>A</td></tr></table>',
        '<table data-pm-slice="0 0 []"><tr><td>A</td></tr></table>',
    ])('should leave mixed content and PM slice metadata intact: %s', (html) => {
        const {view} = createView();
        let result = html;
        view.someProp('transformPastedHTML', (transform) => {
            result = transform(result, view);
        });
        expect(result).toBe(html);
    });

    it('should preserve the original HTML when the feature is disabled', () => {
        const {view} = createView({enabled: false});
        const html = '<table><tr><td>A</td></tr></table>';
        let result = html;
        view.someProp('transformPastedHTML', (transform) => {
            result = transform(result, view);
        });
        expect(result).toBe(html);
    });

    it('should let the YFM table extension parse standard HTML tables', () => {
        const {paste} = createView({withYfm: true});

        const slice = paste('<table><tr><td>A</td><td>B</td></tr></table>');

        expect(slice.content.firstChild?.type.name).toBe(YfmTableNode.Table);
    });

    it('should keep external drop on the standard route without affecting the next paste', () => {
        const {view, paste} = createView();
        const html =
            '<table><thead><tr><th>H</th></tr></thead><tbody><tr><td>A</td></tr></tbody></table>';
        const data = new DataTransferMock();
        data.setData('text/html', html);
        const event = new Event('drop', {bubbles: true, cancelable: true});
        Object.defineProperty(event, 'dataTransfer', {value: data});
        vi.spyOn(view, 'posAtCoords').mockReturnValue({pos: 0, inside: -1});

        view.dom.dispatchEvent(event);

        expect(view.state.doc.firstChild!.type.name).toBe('table');
        view.state.doc.check();
        view.dispatch(view.state.tr.setSelection(TextSelection.atEnd(view.state.doc)));
        expect(paste(html).content.firstChild!.type.name).toBe('tbody');
    });
});

function createView({
    enabled = true,
    withYfm = false,
    extra,
}: {
    enabled?: boolean;
    withYfm?: boolean;
    extra?: (deps: ExtensionDeps) => Plugin;
} = {}) {
    let received: Slice;
    const {schema, plugins} = new ExtensionsManager({
        extensions: (builder) => {
            builder.context.set('tableCellSelection', enabled);
            builder
                .use(BaseSchemaSpecs, {})
                .use(ReactRendererExtension, new ReactRenderStorage())
                .use(Bold, {})
                .use(Table);
            if (withYfm) builder.use(YfmTable, {controls: false});
            if (extra) builder.addPlugin(extra);
            builder.addPlugin(
                () =>
                    new Plugin({
                        props: {
                            handlePaste(_view, _event, slice) {
                                received = slice;
                                return true;
                            },
                        },
                    }),
            );
        },
    }).build();
    const view = new EditorView(null, {state: EditorState.create({schema, plugins})});
    views.push(view);
    return {
        view,
        paste(html: string) {
            view.pasteHTML(html);
            return received!;
        },
    };
}

function texts(slice: Slice): string[] {
    return readValidMatrixSlice(slice)!.cells.map((cell) =>
        cell.content.textBetween(0, cell.content.size),
    );
}
