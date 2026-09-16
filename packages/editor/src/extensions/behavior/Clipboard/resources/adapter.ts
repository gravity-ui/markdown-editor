import {closeHistory, history} from 'prosemirror-history';
import {type EditorState, Plugin, type Transaction} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import {getParserFromState} from '../../../../core/utils/parser';
import type {PasteController} from '../../../../modules/paste/controller';
import {resourceKey} from '../../../../modules/paste/tracking';
import {
    type ResourceOccurrence,
    type ResourceTarget,
    pasteResourceId,
} from '../../../../modules/paste/tracking';

import {
    ResourceCollection,
    encodeResourceUrl,
    resourceAttribute,
    validateResourceUrl,
} from './resources';

// history() uses the history plugin's shared key; no private metadata name is hardcoded.
const historyKey = history().spec.key;
function isHistoryTransaction(tr: Transaction) {
    return Boolean(historyKey && tr.getMeta(historyKey));
}

export const resolvedPasteMeta = 'markdown-editor-resolved-paste';
/** Collaboration integrations can mark remote transactions with this metadata. */
export const remotePasteTransactionMeta = 'markdown-editor-remote-transaction';

function isRemote(tr: Transaction) {
    return Boolean(tr.getMeta(remotePasteTransactionMeta) || tr.getMeta('rebased'));
}

export class ProseMirrorPaste {
    readonly controller: PasteController;
    private event?: {plain: boolean};
    private shift = false;

    constructor(controller: PasteController) {
        this.controller = controller;
    }

    plugin() {
        return new Plugin({
            props: {
                handleDOMEvents: {
                    keydown: (_view, event) => {
                        this.shift = event.shiftKey;
                        return false;
                    },
                    keyup: (_view, event) => {
                        this.shift = event.shiftKey;
                        return false;
                    },
                    paste: (view, event) => {
                        const data = event.clipboardData;
                        const code =
                            view.state.selection.$from.parent.type.spec.code ||
                            view.state.selection.$from.marks().some((mark) => mark.type.spec.code);
                        const files =
                            data?.types.includes('Files') &&
                            !data.types.includes('text/yfm') &&
                            !data.types.includes('text/plain');
                        const context = (this.event = {
                            plain: Boolean(this.shift || code || files),
                        });
                        queueMicrotask(() => {
                            if (this.event === context) this.event = undefined;
                        });
                        return false;
                    },
                },
            },
            appendTransaction: (transactions, _old, state) => {
                if (!transactions.some((tr) => tr.docChanged)) return null;
                return this.replacements(state);
            },
            view: (view) => {
                const unregister = this.controller.register('wysiwyg', {
                    snapshot: () => this.snapshot(view.state),
                    restore: (snapshot) => this.restore(view, snapshot),
                    flush: () => {
                        if (view.isDestroyed) throw new Error('Editor was destroyed');
                        const tr = this.replacements(view.state);
                        if (!tr) return;
                        if (!view.editable) throw new Error('Editor is no longer editable');
                        view.dispatch(tr);
                        if (this.replacements(view.state))
                            throw new Error('Resource replacement was rejected');
                    },
                });
                return {
                    destroy: () => {
                        unregister();
                        this.controller.destroy();
                    },
                };
            },
        });
    }

    dispatch(
        view: EditorView,
        tr: Transaction,
        apply: (tr: Transaction) => readonly Transaction[],
    ) {
        if (
            this.controller.enabled &&
            tr.docChanged &&
            !tr.getMeta(resolvedPasteMeta) &&
            !isRemote(tr)
        ) {
            // Dispatch wrappers (including ProseMirror DevTools) may already have
            // applied and cached the incoming transaction by identity. Never append
            // our resource attributes to that same object. Preserve all transaction
            // properties, with independent mutable step lists, mapping and metadata.
            tr = Object.assign(view.state.tr, tr, {
                steps: [...tr.steps],
                docs: [...tr.docs],
                mapping: tr.mapping.slice(),
                meta: {...Reflect.get(tr, 'meta')},
            });
        }
        const isPaste =
            this.controller.enabled &&
            tr.docChanged &&
            !tr.getMeta(resolvedPasteMeta) &&
            !isRemote(tr) &&
            (this.event || tr.getMeta('uiEvent') === 'paste') &&
            !this.event?.plain;
        if (!isPaste) {
            if (
                this.controller.enabled &&
                tr.docChanged &&
                !tr.getMeta(resolvedPasteMeta) &&
                !isRemote(tr) &&
                !isHistoryTransaction(tr)
            ) {
                const before = new Map<string, string>();
                tr.before.descendants((node) => {
                    const attr = resourceAttribute(node);
                    if (attr && node.attrs[pasteResourceId])
                        before.set(node.attrs[pasteResourceId], node.attrs[attr]);
                });
                tr.doc.descendants((node, pos) => {
                    const attr = resourceAttribute(node);
                    const id = node.attrs[pasteResourceId];
                    if (attr && before.has(id) && before.get(id) !== node.attrs[attr]) {
                        // This belongs to the user's URL edit and is restored by its Undo.
                        tr.setNodeAttribute(pos, pasteResourceId, null);
                    }
                });
            }
            apply(tr);
            return;
        }

        this.event = undefined;
        this.controller.activate('wysiwyg');
        const ranges: Array<{from: number; to: number}> = [];
        tr.mapping.maps.forEach((map, index) => {
            const remaining = tr.mapping.slice(index + 1);
            map.forEach((_from, _to, from, to) => {
                if (from !== to)
                    ranges.push({from: remaining.map(from, 1), to: remaining.map(to, -1)});
            });
        });
        const collection = new ResourceCollection();
        const targets: ResourceTarget[] = [];
        tr.doc.descendants((node, pos) => {
            if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
            const attr = resourceAttribute(node);
            if (!attr || !ranges.some(({from, to}) => pos >= from && pos < to)) return true;
            const resource = collection.add(
                attr === 'src' ? 'image' : 'file',
                node.attrs[attr],
                node.attrs.alt || node.attrs.download,
            );
            const target = this.controller.createTarget(resource);
            targets.push(target);
            tr.setNodeAttribute(pos, pasteResourceId, target.id);
            return true;
        });
        if (!targets.length) {
            apply(tr);
            return;
        }
        const accepted = apply(closeHistory(tr));
        apply(closeHistory(view.state.tr));
        if (!accepted.includes(tr)) return;
        const present = new Set(this.snapshot(view.state).map((item) => item.targetId));
        const inserted = targets.filter((target) => present.has(target.id));
        if (inserted.length)
            this.controller.resolveTargets(
                collection.resources.filter((resource) =>
                    inserted.some(
                        (target) => resourceKey(target.resource) === resourceKey(resource),
                    ),
                ),
                inserted,
                (path) => validateResourceUrl(getParserFromState(view.state), path),
            );
    }

    private snapshot(state: EditorState) {
        const result: ResourceOccurrence[] = [];
        state.doc.descendants((node) => {
            if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
            const attr = resourceAttribute(node);
            if (attr)
                result.push({
                    kind: attr === 'src' ? 'image' : 'file',
                    path: node.attrs[attr],
                    targetId: node.attrs[pasteResourceId] || undefined,
                });
            return true;
        });
        return result;
    }

    private restore(view: EditorView, snapshot: ResourceOccurrence[]) {
        const current = this.snapshot(view.state);
        // Mode conversion must preserve the complete ordered resource list.
        if (
            current.length !== snapshot.length ||
            current.some(
                (item, index) =>
                    item.kind !== snapshot[index].kind || item.path !== snapshot[index].path,
            )
        )
            return;
        const tr = view.state.tr;
        let index = 0;
        tr.doc.descendants((node, pos) => {
            if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
            if (resourceAttribute(node)) {
                const id = snapshot[index++].targetId;
                if (id && this.controller.getTarget(id))
                    tr.setNodeAttribute(pos, pasteResourceId, id);
            }
            return true;
        });
        if (tr.docChanged) view.dispatch(tr.setMeta('addToHistory', false));
    }

    private replacements(state: EditorState) {
        if (!this.controller.enabled || !this.controller.isActive('wysiwyg')) return null;
        const tr = state.tr;
        state.doc.descendants((node, pos) => {
            if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
            const attr = resourceAttribute(node);
            const target = this.controller.getTarget(node.attrs[pasteResourceId]);
            if (
                attr &&
                target?.replacement !== undefined &&
                node.attrs[attr] === target.resource.path
            ) {
                const parser = getParserFromState(state);
                if (!parser.validateLink(target.replacement))
                    throw new Error('Invalid resource URL');
                const url = encodeResourceUrl(parser, target.replacement);
                // AttrStep retains the node's identity, other attributes and selection.
                if (node.attrs[attr] !== url) tr.setNodeAttribute(pos, attr, url);
            }
            return true;
        });
        return tr.docChanged
            ? tr.setMeta('addToHistory', false).setMeta(resolvedPasteMeta, true)
            : null;
    }
}
