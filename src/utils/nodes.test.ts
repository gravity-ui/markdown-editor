import {Schema} from 'prosemirror-model';

import {isNodeEmpty} from './nodes';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        yfm_cut_content: {content: 'block+'},
        paragraph: {content: 'inline*', group: 'block'},
        text: {group: 'inline'},
        code_block: {content: 'inline*', group: 'block'},
    },
});

describe('isNodeEmpty', () => {
    it('yfm_cut_content with an empty paragraph', () => {
        const emptyParagraph = schema.nodes.paragraph.create();
        const yfmCutContent = schema.nodes.yfm_cut_content.create(null, emptyParagraph);

        expect(isNodeEmpty(yfmCutContent)).toBe(true);
    });

    it('yfm_cut_content with a paragraph containing text', () => {
        const textNode = schema.text('Hello, world!');
        const paragraphWithText = schema.nodes.paragraph.create(null, textNode);
        const yfmCutContent = schema.nodes.yfm_cut_content.create(null, paragraphWithText);

        expect(isNodeEmpty(yfmCutContent)).toBe(false);
    });

    it('fm_cut_content with a non-paragraph block', () => {
        const codeBlock = schema.nodes.code_block.create();
        const yfmCutContent = schema.nodes.yfm_cut_content.create(null, codeBlock);

        expect(isNodeEmpty(yfmCutContent)).toBe(false);
    });
});
