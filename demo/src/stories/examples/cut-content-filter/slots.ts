import {CutNode} from '@gravity-ui/markdown-editor';
import {
    type SlotMatch,
    blockContentSlots,
    byType,
} from '@gravity-ui/markdown-editor/markdown-it/block-content-slots';
import type MarkdownIt from 'markdown-it';

const INLINE_CONTENT = new Set(['text', 'link_open', 'link_close', 'softbreak']);

const paragraph = byType('paragraph_open');

/** Paragraph of text and links; any other inline child leaves the group unmatched */
const textParagraph: SlotMatch = (group) =>
    paragraph(group) &&
    group.every(({children}) => (children ?? []).every(({type}) => INLINE_CONTENT.has(type)));

export const cutContentSlots = (md: MarkdownIt) =>
    md.use(blockContentSlots, {
        bodyToken: CutNode.CutContent,
        slots: [{slot: 'content', match: textParagraph}],
    });
