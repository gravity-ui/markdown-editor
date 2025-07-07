import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {dispatchPasteEvent} from '../../../../tests/dispatch-event';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {LoggerFacet} from '../../../core/utils/logger';
import {Logger2} from '../../../logger';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {LinkAttr, LinkSpecs, linkMarkName} from './LinkSpecs';
import {linkPasteEnhance} from './paste-plugin';

const logger = new Logger2();
const {
    schema,
    plugins,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => {
        builder.use(BaseSchemaSpecs, {}).use(LinkSpecs);
        builder.addPlugin(linkPasteEnhance, builder.Priority.High);
    },
    logger,
}).build();
plugins.unshift(LoggerFacet.of(logger));

const {doc, p, lnk} = builders<'doc' | 'p' | 'lnk'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    lnk: {markType: linkMarkName, [LinkAttr.Href]: 'http://example.com?'},
});

const {same} = createMarkupChecker({parser, serializer});

describe('link paste plugin', () => {
    it('parser does not include trailing question mark in matchLinks', () => {
        const match = parser.matchLinks('http://example.com?');
        expect(match?.[0]?.raw).toBe('http://example.com');
    });

    it('pastes url ending with question mark as link for selected text', () => {
        const startDoc = doc(p('<a>test text<b>'));
        const state = EditorState.create({
            schema,
            doc: startDoc,
            selection: TextSelection.create(startDoc, startDoc.tag.a, startDoc.tag.b),
            plugins,
        });
        const view = new EditorView(null, {state});
        dispatchPasteEvent(view, {'text/plain': 'http://example.com?'});
        expect(view.state.doc).toMatchNode(doc(p(lnk('test text'))));
        same('[test text](http://example.com?)', view.state.doc);
    });
});
