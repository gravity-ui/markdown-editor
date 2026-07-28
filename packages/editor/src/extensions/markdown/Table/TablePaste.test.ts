import {EditorState} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {dispatchPasteEvent} from '../../../../tests/dispatch-event';
import {ExtensionsManager} from '../../../core';
import {Logger2} from '../../../logger';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {Clipboard} from '../../behavior/Clipboard';
import {DataTransferType} from '../../behavior/Clipboard/utils';

import {TableSpecs} from './TableSpecs';
import {CellAlign, TableAttrs, TableNode} from './const';
import {isPipeTableCandidate, markdownTablePastePlugin} from './plugins/markdownTablePastePlugin';

const MARKDOWN_TABLE = [
    '| Name | Role | Office | Tenure |',
    '| --- | --- | --- | --- |',
    '| Sergey | Frontend | Belgrade | 5 years |',
    '| Anna | QA | Moscow | 3 years |',
].join('\n');

const HTML_TABLE = `
<table>
    <thead>
        <tr><th>Name</th><th>Role</th><th>Office</th><th>Tenure</th></tr>
    </thead>
    <tbody>
        <tr><td>Sergey</td><td>Frontend</td><td>Belgrade</td><td>5 years</td></tr>
        <tr><td>Anna</td><td>QA</td><td>Moscow</td><td>3 years</td></tr>
    </tbody>
</table>
`;

const {schema, plugins} = new ExtensionsManager({
    logger: new Logger2().nested({env: 'test'}),
    extensions: (builder) => {
        builder.use(BaseSchemaSpecs, {}).use(TableSpecs).use(Clipboard, {});
        builder.addPlugin(markdownTablePastePlugin, builder.Priority.High);
    },
}).build();

const {doc, p, table, thead, tbody, tr, th, td} = builders<
    'doc' | 'p' | 'table' | 'thead' | 'tbody' | 'tr' | 'th' | 'td'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    table: {nodeType: TableNode.Table},
    thead: {nodeType: TableNode.Head},
    tbody: {nodeType: TableNode.Body},
    tr: {nodeType: TableNode.Row},
    th: {nodeType: TableNode.HeaderCell, [TableAttrs.CellAlign]: CellAlign.Left},
    td: {nodeType: TableNode.DataCell, [TableAttrs.CellAlign]: CellAlign.Left},
});

describe('markdownTablePastePlugin', () => {
    it('detects pipe table candidates', () => {
        expect(isPipeTableCandidate(MARKDOWN_TABLE)).toBe(true);
        expect(isPipeTableCandidate(`\n${MARKDOWN_TABLE}\n`)).toBe(true);
        expect(isPipeTableCandidate('plain text')).toBe(false);
        expect(isPipeTableCandidate(HTML_TABLE)).toBe(false);
    });

    it('prefers markdown table from text/plain over text/html', () => {
        const view = createView();

        dispatchPasteEvent(view, {
            [DataTransferType.Text]: MARKDOWN_TABLE,
            [DataTransferType.Html]: HTML_TABLE,
        });

        expect(view.state.doc).toMatchNode(expectedTableDoc());
    });

    it('ignores pipe-bounded text that is not parsed as a table', () => {
        const view = createView();

        dispatchPasteEvent(view, {
            [DataTransferType.Text]: '| not a table |',
            [DataTransferType.Html]: '<p>html text</p>',
        });

        expect(view.state.doc).toMatchNode(doc(p('html text')));
    });

    it('ignores markdown table when parsed content has extra nodes', () => {
        const view = createView();

        dispatchPasteEvent(view, {
            [DataTransferType.Text]: `${MARKDOWN_TABLE}\n\nextra text`,
            [DataTransferType.Html]: '<p>html text</p>',
        });

        expect(view.state.doc).toMatchNode(doc(p('html text')));
    });
});

function createView() {
    return new EditorView(null, {
        state: EditorState.create({schema, plugins}),
    });
}

function expectedTableDoc() {
    return doc(
        table(
            thead(tr(th('Name'), th('Role'), th('Office'), th('Tenure'))),
            tbody(
                tr(td('Sergey'), td('Frontend'), td('Belgrade'), td('5 years')),
                tr(td('Anna'), td('QA'), td('Moscow'), td('3 years')),
            ),
        ),
    );
}
