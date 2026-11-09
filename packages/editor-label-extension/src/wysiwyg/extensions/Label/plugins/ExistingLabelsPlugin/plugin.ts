import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {type EditorState, Plugin, PluginKey} from '@gravity-ui/markdown-editor/pm/state';
import {type LabelColor, normalizeLabelColor} from '@gravity-ui/markdown-plugin-label';

import {LabelAttr, labelNodeType} from '../../LabelSpecs';

export type ExistingLabel = {text: string; color: LabelColor};
type LabelOccurrence = ExistingLabel & {pos: number};
const existingLabelsKey = new PluginKey<readonly LabelOccurrence[]>('existing-labels');

const collectLabels = (doc: Node): readonly LabelOccurrence[] => {
    const type = labelNodeType(doc.type.schema);
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

/** Labels with the same caption, regardless of case, and the same color are one suggestion. */
const labelKey = ({text, color}: ExistingLabel) =>
    JSON.stringify([text.trim().toLowerCase(), color]);

export const getSuggestedLabels = (
    state: EditorState,
    activePos: number,
): readonly ExistingLabel[] => {
    const unique = new Map<string, LabelOccurrence>();
    const current = getExistingLabels(state).find((label) => label.pos === activePos);
    const currentKey = current ? labelKey(current) : null;
    for (const label of getExistingLabels(state)) {
        const key = labelKey(label);
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
