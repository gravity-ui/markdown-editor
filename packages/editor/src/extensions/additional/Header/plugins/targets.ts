import type {NodeType} from '#pm/model';
import {type EditorState, Plugin, PluginKey, type Transaction} from '#pm/state';
import {ReplaceAroundStep} from '#pm/transform';

import {headerActionType, headerType} from '../HeaderSpecs';
import {type FoundHeader, findHeader} from '../commands';

export type HeaderTarget = {id: string; pos: number};
export type HeaderTargets = {header: HeaderTarget; actions: HeaderTarget[]};

const targetsKey = new PluginKey<HeaderTargets | null>('header-targets');

function mapTarget(target: HeaderTarget, tr: Transaction, type: NodeType): HeaderTarget | null {
    let {pos} = target;
    for (let index = 0; index < tr.steps.length; index++) {
        const step = tr.steps[index];
        const mapping = step.getMap();
        const mapped = mapping.mapResult(pos, 1);
        if (mapped.deleted) {
            // setNodeMarkup preserves identity while replacing the node's opening token.
            if (!(step instanceof ReplaceAroundStep) || step.gapFrom !== pos + 1) return null;
            pos = mapping.map(pos + 1, 1) - 1;
        } else {
            pos = mapped.pos;
        }
        const doc = tr.docs[index + 1] ?? tr.doc;
        if (pos < 0 || pos >= doc.content.size || doc.nodeAt(pos)?.type !== type) return null;
    }
    return {...target, pos};
}

export function headerTargetsPlugin() {
    let nextId = 0;
    const createTarget = (pos: number): HeaderTarget => ({id: `header-target-${++nextId}`, pos});

    const readTargets = (
        state: EditorState,
        previous: HeaderTargets | null,
        tr?: Transaction,
    ): HeaderTargets | null => {
        const found = findHeader(state);
        if (!found || state.selection.to > found.pos + found.node.nodeSize) return null;
        if (previous?.header.pos === found.pos && !tr?.docChanged) return previous;

        const mappedHeader =
            previous && tr ? mapTarget(previous.header, tr, headerType(state.schema)) : null;
        const sameHeader = mappedHeader?.pos === found.pos;
        const previousActions =
            sameHeader && previous && tr
                ? previous.actions.flatMap((target) => {
                      const mapped = mapTarget(target, tr, headerActionType(state.schema));
                      return mapped ? [mapped] : [];
                  })
                : [];
        const actions: HeaderTarget[] = [];
        const actionsStart =
            found.pos + 2 + found.node.child(0).nodeSize + found.node.child(1).nodeSize;
        found.node.child(2).forEach((_node, offset) => {
            const pos = actionsStart + offset;
            actions.push(previousActions.find((target) => target.pos === pos) ?? createTarget(pos));
        });

        return {header: sameHeader ? mappedHeader : createTarget(found.pos), actions};
    };

    return new Plugin<HeaderTargets | null>({
        key: targetsKey,
        state: {
            init: (_config, state) => readTargets(state, null),
            apply: (tr, previous, _oldState, state) => readTargets(state, previous, tr),
        },
    });
}

export function getHeaderTargets(state: EditorState): HeaderTargets | null {
    return targetsKey.getState(state) ?? null;
}

export function resolveHeaderTarget(state: EditorState, id: string): FoundHeader | null {
    const targets = getHeaderTargets(state);
    const target = targets && [targets.header, ...targets.actions].find((item) => item.id === id);
    if (!target) return null;

    const node = state.doc.nodeAt(target.pos);
    return node ? {pos: target.pos, node} : null;
}
