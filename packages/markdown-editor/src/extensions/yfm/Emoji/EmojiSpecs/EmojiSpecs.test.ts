import {builders} from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../../../extensions/specs';

import {EmojiSpecs} from './EmojiSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(EmojiSpecs, {defs: {ddd: 'x'}}),
}).buildDeps();

const {doc, p, emoji} = builders<'doc' | 'p' | 'emoji'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    emoji: {nodeType: EmojiSpecs.NodeName},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Emoji extension', () => {
    it('should parse emoji', () => {
        same(
            'I can parse :ddd: emoji',
            doc(p('I can parse ', emoji({[EmojiSpecs.NodeAttrs.Markup]: 'ddd'}, 'x'), ' emoji')),
        );
    });
});
