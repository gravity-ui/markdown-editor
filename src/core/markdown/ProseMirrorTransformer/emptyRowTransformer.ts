import {TransformFn} from './index';

export const transformEmptyParagraph: TransformFn = (node) => {
    if (node.type !== 'paragraph') return;
    if (node.content?.length !== 1) return;
    if (node.content[0]?.type !== 'text') return;
    if (node.content[0].text === String.fromCharCode(160)) delete node.content;
};
