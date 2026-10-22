import type {Node} from 'prosemirror-model';
import {type EditorState, Plugin, PluginKey} from 'prosemirror-state';

import {LabelAttr, type LabelColor, labelType, normalizeLabelColor} from './LabelSpecs';

export type ExistingLabel = {text: string; color: LabelColor};
type LabelOccurrence = ExistingLabel & {pos: number};
const existingLabelsKey = new PluginKey<readonly LabelOccurrence[]>('existing-labels');

const collectLabels = (doc: Node): readonly LabelOccurrence[] => {
    const type = labelType(doc.type.schema);
    const labels: LabelOccurrence[] = [];
    doc.descendants((node, pos) => {
        if (node.type !== type) return;
        const text: string = node.attrs[LabelAttr.Text];
        if (!text.trim()) return;
        labels.push({text, color: normalizeLabelColor(node.attrs[LabelAttr.Color]), pos});
    });
    return labels;
};

/** The page's labels are indexed only when its document changes. */
export const existingLabelsPlugin = () =>
    new Plugin({
        key: existingLabelsKey,
        state: {
            init: (_, state) => collectLabels(state.doc),
            apply: (tr, previous) => (tr.docChanged ? collectLabels(tr.doc) : previous),
        },
    });

export const getExistingLabels = (state: EditorState): readonly LabelOccurrence[] =>
    existingLabelsKey.getState(state) ?? [];

export const getSuggestedLabels = (
    state: EditorState,
    activePos: number,
): readonly ExistingLabel[] => {
    const unique = new Map<string, LabelOccurrence>();
    const current = state.doc.nodeAt(activePos < 0 ? 0 : activePos);
    const currentKey =
        current?.type === labelType(state.schema)
            ? JSON.stringify([
                  String(current.attrs[LabelAttr.Text]).trim().toLowerCase(),
                  normalizeLabelColor(current.attrs[LabelAttr.Color]),
              ])
            : null;
    for (const label of getExistingLabels(state)) {
        if (label.pos === activePos) continue;
        const key = JSON.stringify([label.text.trim().toLowerCase(), label.color]);
        if (key === currentKey) continue;
        const previous = unique.get(key);
        if (!previous || Math.abs(label.pos - activePos) < Math.abs(previous.pos - activePos))
            unique.set(key, label);
    }
    return [...unique.values()]
        .sort(
            (a, b) =>
                Math.abs(a.pos - activePos) - Math.abs(b.pos - activePos) ||
                a.text.localeCompare(b.text) ||
                a.color.localeCompare(b.color),
        )
        .slice(0, 20)
        .map(({text, color}) => ({text: text.trim(), color}));
};
