import {type Node, Schema} from 'prosemirror-model';
import {AllSelection, NodeSelection, TextSelection} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseNode, BaseSchemaSpecs} from 'src/extensions/base/specs';
import {BlockquoteSpecs} from 'src/extensions/markdown/Blockquote/BlockquoteSpecs';
import {CodeBlockSpecs} from 'src/extensions/markdown/CodeBlock/CodeBlockSpecs';
import {HeadingSpecs} from 'src/extensions/markdown/Heading/HeadingSpecs';
import {HorizontalRuleSpecs} from 'src/extensions/markdown/HorizontalRule/HorizontalRuleSpecs';
import {ListsSpecs} from 'src/extensions/markdown/Lists/ListsSpecs';
import {Table} from 'src/extensions/markdown/Table';
import {TableNode} from 'src/extensions/markdown/Table/const';
import {YfmTable} from 'src/extensions/yfm/YfmTable';
import {YfmTableNode} from 'src/extensions/yfm/YfmTable/YfmTableSpecs/const';
import {getTableGeometry} from 'src/table-utils/cell-selection/geometry';
import {TableCellSelection} from 'src/table-utils/cell-selection/selection';

import {resolveMatrixTarget} from './target';

const {markupParser, schema} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BlockquoteSpecs)
            .use(CodeBlockSpecs, {})
            .use(HeadingSpecs, {})
            .use(HorizontalRuleSpecs)
            .use(ListsSpecs)
            .use(Table)
            .use(YfmTable, {controls: false}),
}).buildDeps();

describe('matrix paste target', () => {
    it('should start a reverse matrix selection at its top-left cell', () => {
        const doc = markupParser.parse('| A | B | C |\n| --- | --- | --- |\n| D | E | F |');
        const geometry = getTableGeometry(doc.firstChild!)!;
        const selection = TableCellSelection.create(
            doc,
            geometry.cellAt(1, 2)!.offset,
            geometry.cellAt(0, 1)!.offset,
        );

        expect(resolveMatrixTarget(selection)).toEqual({
            kind: 'table',
            tablePos: 0,
            geometry,
            row: 0,
            column: 1,
        });
    });

    it('should route a cursor outside tables to a standalone insertion', () => {
        const doc = markupParser.parse('outside');

        expect(resolveMatrixTarget(TextSelection.create(doc, 3))).toEqual({kind: 'standalone'});
    });

    it('should insert a standalone table when replacing outside blocks', () => {
        const doc = markupParser.parse('outside');

        expect(resolveMatrixTarget(new AllSelection(doc))).toEqual({kind: 'standalone'});
        expect(resolveMatrixTarget(NodeSelection.create(doc, 0))).toEqual({kind: 'standalone'});
    });

    it('should start a Markdown cursor at its cell', () => {
        const doc = markupParser.parse('| A | B |\n| --- | --- |\n| C | D |');
        const geometry = getTableGeometry(doc.firstChild!)!;
        const selection = TextSelection.create(doc, geometry.cellAt(1, 1)!.offset + 1);

        expect(resolveMatrixTarget(selection)).toMatchObject({
            kind: 'table',
            tablePos: 0,
            row: 1,
            column: 1,
        });
    });

    it('should accept partial text selection across every paragraph of one YFM cell', () => {
        const doc = documentWithCell(paragraph('first'), paragraph('last'));
        const selection = TextSelection.create(
            doc,
            textPosition(doc, 'first') + 2,
            textPosition(doc, 'last') + 2,
        );

        expect(resolveMatrixTarget(selection)).toMatchObject({kind: 'table', row: 0, column: 0});
    });

    it.each(['', 'text'])('should accept a cursor in one YFM paragraph (%s)', (text) => {
        const doc = documentWithCell(paragraph(text));
        const cell = getTableGeometry(doc.firstChild!)!.cellAt(0, 0)!;

        expect(resolveMatrixTarget(TextSelection.create(doc, cell.offset + 2))).toMatchObject({
            kind: 'table',
        });
    });

    it('should preserve ordinary insertion for a cursor in a multi-block cell', () => {
        const doc = documentWithCell(paragraph('first'), paragraph('last'));

        expect(resolveMatrixTarget(TextSelection.create(doc, textPosition(doc, 'first')))).toEqual({
            kind: 'ordinary',
        });
    });

    it('should preserve ordinary insertion when one paragraph is not touched', () => {
        const doc = documentWithCell(paragraph('first'), paragraph('last'));
        const start = textPosition(doc, 'first');

        expect(resolveMatrixTarget(TextSelection.create(doc, start + 1, start + 3))).toEqual({
            kind: 'ordinary',
        });
    });

    it('should check every nested list item and quote paragraph', () => {
        const blocks = markupParser.parse('- first\n  - second\n\n> last').content;
        const doc = documentWithCell(
            ...Array.from({length: blocks.childCount}, (_, i) => blocks.child(i)),
        );
        const start = textPosition(doc, 'first') + 1;

        expect(
            resolveMatrixTarget(TextSelection.create(doc, start, textPosition(doc, 'second') + 2)),
        ).toEqual({kind: 'ordinary'});
        expect(
            resolveMatrixTarget(TextSelection.create(doc, start, textPosition(doc, 'last') + 2)),
        ).toMatchObject({kind: 'table'});
    });

    it('should count an empty paragraph when its text position is a selection boundary', () => {
        const doc = documentWithCell(paragraph('first'), paragraph());
        const firstPos = textPosition(doc, 'first');
        const emptyPos = firstPos + 'first'.length + 2;

        expect(resolveMatrixTarget(TextSelection.create(doc, firstPos + 1, firstPos + 3))).toEqual({
            kind: 'ordinary',
        });
        expect(
            resolveMatrixTarget(TextSelection.create(doc, firstPos + 1, emptyPos)),
        ).toMatchObject({kind: 'table'});
    });

    it.each(['heading', 'code_block'])(
        'should require text intersection but no full coverage for %s',
        (nodeName) => {
            const doc = documentWithCell(schema.node(nodeName, null, schema.text('content')));
            const start = textPosition(doc, 'content') + 2;

            expect(resolveMatrixTarget(TextSelection.create(doc, start))).toEqual({
                kind: 'ordinary',
            });
            expect(resolveMatrixTarget(TextSelection.create(doc, start, start + 2))).toMatchObject({
                kind: 'table',
            });
        },
    );

    it('should require full inclusion of a non-text leaf block', () => {
        const doc = documentWithCell(
            paragraph('first'),
            schema.node('horizontal_rule'),
            paragraph('last'),
        );
        const start = textPosition(doc, 'first') + 1;

        expect(resolveMatrixTarget(TextSelection.create(doc, start, start + 2))).toEqual({
            kind: 'ordinary',
        });
        expect(
            resolveMatrixTarget(TextSelection.create(doc, start, textPosition(doc, 'last') + 2)),
        ).toMatchObject({kind: 'table'});
    });

    it.each([false, true])(
        'should start a cross-row text selection at C1 in either direction (reverse=%s)',
        (reverse) => {
            const doc = schema.node(
                BaseNode.Doc,
                null,
                yfmTable([
                    [
                        yfmCell(paragraph('A1')),
                        yfmCell(paragraph('B1')),
                        yfmCell(paragraph('C1'), paragraph('extra')),
                    ],
                    [
                        yfmCell(paragraph('A2'), paragraph('tail')),
                        yfmCell(paragraph('B2')),
                        yfmCell(paragraph('C2')),
                    ],
                ]),
            );
            const from = textPosition(doc, 'C1') + 1;
            const to = textPosition(doc, 'A2') + 1;
            const selection = TextSelection.create(doc, reverse ? to : from, reverse ? from : to);

            expect(resolveMatrixTarget(selection)).toMatchObject({
                kind: 'table',
                row: 0,
                column: 2,
            });
        },
    );

    it('should use the deepest table for text and explicit matrix selections', () => {
        const inner = yfmTable([[yfmCell(paragraph('inner'))]]);
        const doc = documentWithCell(paragraph('before'), inner, paragraph('after'));
        const innerPos = textPosition(doc, 'inner');
        const target = resolveMatrixTarget(TextSelection.create(doc, innerPos));

        expect(target).toMatchObject({kind: 'table', tablePos: 12});
        expect(resolveMatrixTarget(TableCellSelection.create(doc, 3))).toMatchObject({
            kind: 'table',
            tablePos: 0,
        });
    });

    it('should treat a fully included nested table as one outer cell block', () => {
        const inner = yfmTable([[yfmCell(paragraph('inner'))]]);
        const doc = documentWithCell(paragraph('before'), inner, paragraph('after'));
        const selection = TextSelection.create(
            doc,
            textPosition(doc, 'before') + 1,
            textPosition(doc, 'after') + 2,
        );

        expect(resolveMatrixTarget(selection)).toMatchObject({kind: 'table', tablePos: 0});
    });

    it('should keep ordinary insertion when a selection leaves a nested table', () => {
        const inner = yfmTable([[yfmCell(paragraph('inner'))]]);
        const doc = documentWithCell(inner, paragraph('after'));
        const selection = TextSelection.create(
            doc,
            textPosition(doc, 'inner') + 1,
            textPosition(doc, 'after') + 2,
        );

        expect(resolveMatrixTarget(selection)).toEqual({kind: 'ordinary'});
    });

    it('should keep ordinary insertion between separate nested tables', () => {
        const first = yfmTable([[yfmCell(paragraph('first'))]]);
        const second = yfmTable([[yfmCell(paragraph('second'))]]);
        const doc = documentWithCell(first, second);
        const selection = TextSelection.create(
            doc,
            textPosition(doc, 'first') + 1,
            textPosition(doc, 'second') + 2,
        );

        expect(resolveMatrixTarget(selection)).toEqual({kind: 'ordinary'});
    });

    it('should preserve ordinary replacement for a table NodeSelection', () => {
        const doc = markupParser.parse('| A |\n| --- |\n| B |');

        expect(resolveMatrixTarget(NodeSelection.create(doc, 0))).toEqual({kind: 'ordinary'});
    });

    it('should skip a nonempty start cell touched only at its content boundary', () => {
        const doc = markupParser.parse('| A | B | C |\n| --- | --- | --- |\n| D | E | F |');
        const selection = TextSelection.create(
            doc,
            textPosition(doc, 'C') + 1,
            textPosition(doc, 'D') + 1,
        );

        expect(resolveMatrixTarget(selection)).toMatchObject({kind: 'table', row: 1, column: 0});
    });

    it('should not bypass block coverage through an untouched end cell', () => {
        const doc = schema.node(
            BaseNode.Doc,
            null,
            yfmTable([
                [yfmCell(paragraph('first'), paragraph('last')), yfmCell(paragraph('second'))],
            ]),
        );
        const selection = TextSelection.create(
            doc,
            textPosition(doc, 'last') + 1,
            textPosition(doc, 'second'),
        );

        expect(resolveMatrixTarget(selection)).toEqual({kind: 'ordinary'});
    });

    it('should preserve ordinary replacement when a text selection includes a table and outside text', () => {
        const doc = markupParser.parse('before\n\n| A |\n| --- |\n| B |\n\nafter');
        const selection = TextSelection.create(
            doc,
            textPosition(doc, 'before') + 1,
            textPosition(doc, 'after') + 2,
        );

        expect(resolveMatrixTarget(selection)).toEqual({kind: 'ordinary'});
    });

    it('should preserve ordinary replacement when a text selection ends outside a table', () => {
        const doc = markupParser.parse('| A |\n| --- |\n| B |\n\nafter');
        const selection = TextSelection.create(
            doc,
            textPosition(doc, 'B'),
            textPosition(doc, 'after') + 2,
        );

        expect(resolveMatrixTarget(selection)).toEqual({kind: 'ordinary'});
    });

    it('should keep matrix and text routing separate without an adapter', () => {
        const withoutAdapter = new Schema({
            nodes: schema.spec.nodes.update(TableNode.Table, {
                ...schema.spec.nodes.get(TableNode.Table)!,
                tableMatrix: undefined,
            }),
            marks: schema.spec.marks,
        });
        const doc = withoutAdapter.nodeFromJSON(
            markupParser.parse('| A |\n| --- |\n| B |').toJSON(),
        );
        const cell = getTableGeometry(doc.firstChild!)!.cellAt(0, 0)!;

        expect(resolveMatrixTarget(TextSelection.create(doc, cell.offset + 1))).toEqual({
            kind: 'ordinary',
        });
        expect(resolveMatrixTarget(TableCellSelection.create(doc, cell.offset))).toMatchObject({
            kind: 'table',
        });
    });

    it('should not enable matrix insertion with an adapter but no geometry', () => {
        const withoutGeometry = new Schema({
            nodes: schema.spec.nodes.update(TableNode.Table, {
                ...schema.spec.nodes.get(TableNode.Table)!,
                tableGeometry: undefined,
                tableRole: undefined,
            }),
            marks: schema.spec.marks,
        });
        const doc = withoutGeometry.nodeFromJSON(
            markupParser.parse('| A |\n| --- |\n| B |').toJSON(),
        );

        expect(resolveMatrixTarget(TextSelection.create(doc, textPosition(doc, 'A')))).toEqual({
            kind: 'ordinary',
        });
    });
});

function documentWithCell(...blocks: Node[]): Node {
    return schema.node(BaseNode.Doc, null, yfmTable([[yfmCell(...blocks)]]));
}

function yfmTable(rows: Node[][]): Node {
    return schema.node(
        YfmTableNode.Table,
        null,
        schema.node(
            YfmTableNode.Body,
            null,
            rows.map((cells) => schema.node(YfmTableNode.Row, null, cells)),
        ),
    );
}

function yfmCell(...blocks: Node[]): Node {
    return schema.node(YfmTableNode.Cell, null, blocks);
}

function paragraph(text = ''): Node {
    return schema.node(BaseNode.Paragraph, null, text ? schema.text(text) : undefined);
}

function textPosition(doc: Node, text: string): number {
    let found: number | undefined;
    doc.descendants((node, pos) => {
        if (node.isText && node.text === text) found = pos;
    });
    if (found === undefined) throw new Error(`Missing text: ${text}`);
    return found;
}
