import type {Node} from 'prosemirror-model';
import type {} from '../extensions/behavior/Placeholder';
import isFunction from 'lodash/isFunction';
import {BaseNode, CheckboxNode, CutNode, DeflistNode, TabsNode, YfmTableNode} from '../extensions';
import {NoteNode} from '../extensions/yfm/YfmNote/YfmNoteSpecs/const';

type NeedPlaceholder =
    | BaseNode.Paragraph
    | CheckboxNode.Label
    | DeflistNode.Term
    | DeflistNode.Desc
    | CutNode.CutTitle
    | CutNode.CutContent
    | TabsNode.Tab
    | NoteNode.NoteTitle
    | YfmTableNode.Cell
    | 'imgSize'
    | 'heading';

export type PlaceholderOptions = Partial<Record<NeedPlaceholder, string | (() => string)>>;

export const processPlaceholderContent = (placeholder: string | (() => string) | undefined) =>
    isFunction(placeholder) ? placeholder() : placeholder;

export const getPlaceholderContent = (node: Node, parent?: Node | null) => {
    const content = node.type.spec.placeholder?.content || '';

    return typeof content === 'function' ? content(node, parent) : content;
};
