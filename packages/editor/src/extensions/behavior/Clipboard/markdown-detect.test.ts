import {EditorState} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {dispatchPasteEvent} from '../../../../tests/dispatch-event';
import {ExtensionsManager} from '../../../core';
import {Logger2} from '../../../logger';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {TableSpecs} from '../../markdown/Table/TableSpecs';
import {CellAlign, TableAttrs, TableNode} from '../../markdown/Table/const';
import {YfmTableSpecs} from '../../yfm/YfmTable/YfmTableSpecs';

import {detectMarkdown} from './markdown-detect';
import {DataTransferType} from './utils';

import {Clipboard} from './index';

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

const {schema, textParser, plugins} = new ExtensionsManager({
    logger: new Logger2().nested({env: 'test'}),
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(TableSpecs).use(YfmTableSpecs, {}).use(Clipboard, {}),
}).build();

const {doc, table, thead, tbody, tr, th, td} = builders<
    'doc' | 'table' | 'thead' | 'tbody' | 'tr' | 'th' | 'td'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    table: {nodeType: TableNode.Table},
    thead: {nodeType: TableNode.Head},
    tbody: {nodeType: TableNode.Body},
    tr: {nodeType: TableNode.Row},
    th: {nodeType: TableNode.HeaderCell, [TableAttrs.CellAlign]: CellAlign.Left},
    td: {nodeType: TableNode.DataCell, [TableAttrs.CellAlign]: CellAlign.Left},
});

describe('detectMarkdown', () => {
    it('detects markdown table using existing parser', () => {
        const markdownDoc = detectMarkdown(MARKDOWN_TABLE, textParser);

        expect(markdownDoc).toMatchNode(expectedTableDoc());
    });

    it('ignores plain text and raw html', () => {
        expect(detectMarkdown('plain text', textParser)).toBeNull();
        expect(detectMarkdown(HTML_TABLE, textParser)).toBeNull();
    });
});

describe('Clipboard markdown detection', () => {
    it('prefers markdown table from text/plain over text/html', () => {
        const view = new EditorView(null, {
            state: EditorState.create({schema, plugins}),
        });

        dispatchPasteEvent(view, {
            [DataTransferType.Text]: MARKDOWN_TABLE,
            [DataTransferType.Html]: HTML_TABLE,
        });

        expect(view.state.doc).toMatchNode(expectedTableDoc());
    });
});

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
