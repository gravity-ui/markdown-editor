import type {Node} from 'prosemirror-model';
import {Plugin, Transaction} from 'prosemirror-state';
import {
    AddMarkStep,
    AddNodeMarkStep,
    DocAttrStep,
    RemoveMarkStep,
    RemoveNodeMarkStep,
    ReplaceStep,
} from 'prosemirror-transform';
import {findChildren} from 'prosemirror-utils';
import {Decoration, DecorationAttrs, DecorationSet} from 'prosemirror-view';

import {YfmHeadingAttr} from '../const';
import {
    isFoldedHeading,
    isFoldingHeading,
    isHeading,
    isUnfoldedHeading,
    parseLevel,
} from '../utils';

import './folding.scss';

const CHANGE_META_KEY = 'folding-heading-changed';

export const foldingPlugin = () => {
    return new Plugin<DecorationSet>({
        state: {
            init: (_config, state) => buildDecosSet(state.doc),
            apply: (tr, prev) => {
                if (tr.getMeta(CHANGE_META_KEY)) {
                    return buildDecosSet(tr.doc);
                }

                if (
                    !tr.docChanged ||
                    // Optimization: ignoring trs, that don't change position of blocks in doc
                    canSafelyIgnoreTr(tr)
                ) {
                    return prev.map(tr.mapping, tr.doc);
                }

                return buildDecosSet(tr.doc);
            },
        },
        props: {
            decorations(state) {
                return this.getState(state);
            },
            handleClickOn(view, _pos, node, nodePos, event, direct) {
                if (direct && isFoldingHeading(node) && isLeftPaddingClick(event)) {
                    view.dispatch(
                        view.state.tr
                            .setNodeAttribute(
                                nodePos,
                                YfmHeadingAttr.Folding,
                                !node.attrs[YfmHeadingAttr.Folding],
                            )
                            .setMeta(CHANGE_META_KEY, true),
                    );
                }
            },
        },
    });
};

function isLeftPaddingClick(event: MouseEvent): boolean {
    const elem = event.target as HTMLElement;
    const leftPadding = parseInt(window.getComputedStyle(elem).paddingLeft, 10);

    if (Number.isNaN(leftPadding)) return true;

    return event.offsetX < leftPadding;
}

const safeSteps = [AddMarkStep, AddNodeMarkStep, DocAttrStep, RemoveMarkStep, RemoveNodeMarkStep];
function canSafelyIgnoreTr(tr: Transaction): boolean {
    if (isInputTr(tr) || isTextBackspaceTr(tr)) return true;
    if (tr.steps.every((step) => safeSteps.some((SafeStep) => step instanceof SafeStep)))
        return true;
    return false;
}

function isInputTr(tr: Transaction): boolean {
    if (tr.steps.length !== 1) return false;
    const [step] = tr.steps;
    return (
        step instanceof ReplaceStep &&
        step.from === step.to &&
        step.slice.content.childCount === 1 &&
        step.slice.content.child(0).type.name === 'text'
    );
}

function isTextBackspaceTr(tr: Transaction): boolean {
    if (tr.steps.length !== 1) return false;
    const [step] = tr.steps;
    return step instanceof ReplaceStep && step.to - step.from === 1 && step.slice.size === 0;
}

// eslint-disable-next-line complexity
function buildDecosSet(doc: Node): DecorationSet {
    const contentDecos: Record<number, {from: number; to: number; hidden: boolean}> = {};
    const separatorDecos: Record<number, {from: number; to: number; value: string}> = {};

    const headings = findChildren(doc, isFoldingHeading, true);
    for (const {node, pos} of headings) {
        // don't add decorations to nested hidden headings and its content
        if (contentDecos[pos]?.hidden) continue;

        const isFolded = isFoldedHeading(node);

        const nodeLevel = parseLevel(node);
        const $pos = doc.resolve(pos + 1);
        const depth = $pos.depth - 1;
        const parent = $pos.node(depth);

        let idx = $pos.index(depth);
        let child: Node | null = null;

        if (isFolded) {
            while ((child = parent.maybeChild(++idx))) {
                if (isHeading(child) && parseLevel(child) <= nodeLevel) break;

                const childPos = $pos.posAtIndex(idx, depth);
                contentDecos[childPos] = {
                    from: childPos,
                    to: childPos + child.nodeSize,
                    hidden: true,
                };
            }
            continue;
        }

        let hLevel = nodeLevel;
        let nextFoldingHeadingFound = false;
        let hidden = false;
        let lastNonHiddenChild: {node: Node; pos: number; level: number} | null = null;

        while ((child = parent.maybeChild(++idx))) {
            const childPos = $pos.posAtIndex(idx, depth);

            if (isHeading(child)) {
                const hasFolding = isFoldingHeading(child);
                if (hasFolding) {
                    nextFoldingHeadingFound = true;
                }

                const level = parseLevel(child);
                if (level <= nodeLevel) break;

                if (!hidden) {
                    lastNonHiddenChild = {node: child, pos: childPos, level: hLevel};
                }

                if (hasFolding) {
                    if (isUnfoldedHeading(child)) {
                        hLevel = level;
                        hidden = false;
                    } else {
                        hidden = true;
                    }
                }
            }

            if (!hidden) {
                lastNonHiddenChild = {node: child, pos: childPos, level: hLevel};
            }

            if (!nextFoldingHeadingFound) {
                contentDecos[childPos] = {
                    from: childPos,
                    to: childPos + child.nodeSize,
                    hidden: false,
                };
            }
        }

        if (lastNonHiddenChild && !separatorDecos[lastNonHiddenChild.pos]) {
            const {pos, node, level} = lastNonHiddenChild;
            separatorDecos[pos] = {
                from: pos,
                to: pos + node.nodeSize,
                value: nodeLevel === level ? 'h' + hLevel : `h${nodeLevel}-h${hLevel}`,
            };
        }
    }

    const decorations: Decoration[] = [];
    for (const item of Object.values(contentDecos)) {
        const attrs: DecorationAttrs = item.hidden
            ? {class: 'pm-h-folding-hidden'}
            : {
                  class: 'pm-h-folding-content',
                  nodeName: 'div',
              };
        decorations.push(Decoration.node(item.from, item.to, attrs));
    }
    for (const item of Object.values(separatorDecos)) {
        decorations.push(
            Decoration.node(item.from, item.to, {
                nodeName: 'div',
                class: 'pm-h-folding-label',
                'data-value': item.value,
            }),
            Decoration.node(item.from, item.to, {
                nodeName: 'div',
                class: 'pm-h-folding-separator',
            }),
        );
    }

    return DecorationSet.create(doc, decorations);
}
