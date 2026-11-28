import {VIEWER_ROOT_ATTRIBUTE, VIEWER_SLOT_ATTRIBUTE} from '../../constants';
import type {AfterCommit} from '../../lifecycle/types';
import {getDomConstructor} from '../../utils/dom-constructor';

type Slot = string | symbol;
type Targets = [HTMLElement, number][];

interface Owner {
    slot: Slot;
    selector: string;
    signal: AbortSignal;
    notify: (targets: Targets) => void;
    claims: Map<HTMLElement, Claim>;
}

interface Claim {
    target: HTMLElement;
    owner: Owner;
    id: number;
    original?: DocumentFragment;
}

const replacement = Symbol('replace');

export class TargetRegistry {
    readonly root: HTMLElement;
    private readonly afterCommit: AfterCommit;
    private readonly owners = new Set<Owner>();
    private readonly pending = new Set<Claim>();
    private readonly active = new Map<Node, Set<Slot>>();
    private readonly detached = new Map<Node, HTMLElement>();
    private readonly released = new Map<HTMLElement, DocumentFragment>();
    private readonly ids = new WeakMap<HTMLElement, number>();
    private nextId = 0;
    private deferred?: Set<Owner>;

    constructor(root: HTMLElement, afterCommit: AfterCommit) {
        this.root = root;
        this.afterCommit = afterCommit;
    }

    subscribe(
        selector: string,
        mode: 'append' | 'replace',
        slotKey: string | undefined,
        signal: AbortSignal,
        notify: Owner['notify'],
    ) {
        const slot = mode === 'replace' ? replacement : (slotKey ?? Symbol());
        const owner: Owner = {slot, selector, signal, notify, claims: new Map()};
        this.search(owner);
        this.owners.add(owner);
        if (this.deferred) this.deferred.add(owner);
        else this.flush(new Set([owner]), owner.claims.values());
        return {
            canResume: (target: HTMLElement) => this.canActivate(target, slot),
            select: (next: string) => {
                if (owner.selector === next) return;
                owner.selector = next;
                this.search(owner);
                this.defer().add(owner);
            },
            remove: () => {
                this.owners.delete(owner);
                for (const claim of owner.claims.values()) this.release(claim);
                this.deferred?.delete(owner);
                if (this.pending.size || this.released.size) this.defer();
            },
        };
    }

    private defer() {
        if (this.deferred) return this.deferred;
        const updates = new Set<Owner>();
        this.deferred = updates;
        // Other slots can unmount or change their selectors in the same commit.
        this.afterCommit(() => {
            this.deferred = undefined;
            this.flush(updates);
        });
        return updates;
    }

    private search(owner: Owner, restored?: Set<Node>) {
        const {root} = this;
        const Host = getDomConstructor(root, 'HTMLElement');
        const remaining = new Map(owner.claims);
        root.querySelectorAll(owner.selector).forEach((target) => {
            if (!(target instanceof Host) || !belongsToViewer(target, root)) return;
            if (restored && !inSubtrees(target, restored)) return;
            if (remaining.delete(target)) return;
            const id = this.ids.get(target) ?? this.nextId++;
            this.ids.set(target, id);
            const claim = {owner, target, id};
            owner.claims.set(target, claim);
            this.pending.add(claim);
        });
        for (const claim of remaining.values()) {
            const {target} = claim;
            const shouldRelease = restored
                ? inSubtrees(target, restored)
                : !this.detached.has(target.getRootNode());
            if (shouldRelease) this.release(claim);
        }
    }

    private release(claim: Claim) {
        const {target, owner, original} = claim;
        owner.claims.delete(target);
        if (this.pending.delete(claim)) return;
        const slots = this.active.get(target);
        slots?.delete(owner.slot);
        if (!slots?.size) this.active.delete(target);
        if (original) this.released.set(target, original);
    }

    private restore(hosts: Iterable<HTMLElement>) {
        const restored = new Set<Node>();
        for (const host of hosts) {
            const original = this.released.get(host);
            if (!original) continue;
            this.released.delete(host);
            this.detached.delete(original);
            if (this.root.contains(host)) {
                for (const node of Array.from(original.children)) restored.add(node);
            }
            host.prepend(original);
        }
        if (restored.size) {
            for (const owner of this.owners) {
                if (!owner.signal.aborted) this.search(owner, restored);
            }
        }
    }

    private flush(updates: Set<Owner>, claims: Iterable<Claim> = this.pending) {
        if (this.released.size > 1) this.restoreWaitingChildren();
        do {
            for (const claim of claims) {
                const {target, owner} = claim;
                if (owner.signal.aborted) continue;
                // A waiting child needs the live viewer to check its selector.
                const host = this.released.size && this.detached.get(target.getRootNode());
                if (host && this.released.has(host)) {
                    this.restore([host]);
                    if (!this.pending.has(claim)) continue;
                }
                if (!this.canActivate(target, owner.slot)) continue;
                const slots = this.active.get(target) ?? new Set<Slot>();
                if (owner.slot === replacement) {
                    claim.original = detachContent(target, this.released.get(target));
                    this.released.delete(target);
                    this.detached.set(claim.original, target);
                }
                slots.add(owner.slot);
                this.active.set(target, slots);
                this.pending.delete(claim);
                updates.add(owner);
            }
            if (!this.released.size) break;
            this.restore(this.released.keys());
        } while (this.pending.size);
        for (const owner of updates) {
            const targets: Targets = [];
            for (const [target, claim] of owner.claims) {
                if (!this.pending.has(claim)) targets.push([target, claim.id]);
            }
            owner.notify(targets);
        }
    }

    private restoreWaitingChildren() {
        const hosts = new Set<HTMLElement>();
        const replacements = new Set<Node>();
        for (const {target, owner} of this.pending) {
            if (owner.signal.aborted) continue;
            if (
                owner.slot === replacement &&
                !replacements.has(target) &&
                this.canActivate(target, replacement)
            ) {
                replacements.add(target);
            }
            const host = this.detached.get(target.getRootNode());
            // An earlier replacement on the host or above it may take over directly.
            if (host && this.released.has(host) && !inSubtrees(host, replacements)) hosts.add(host);
        }
        this.restore(hosts);
    }

    private canActivate(target: HTMLElement, slot: Slot) {
        if (!this.root.contains(target) || this.hasReplacingParent(target)) return false;
        const slots = this.active.get(target);
        return slot === replacement
            ? !slots?.size && !this.hasActiveDescendant(target)
            : !slots?.has(slot) && !slots?.has(replacement);
    }

    private hasReplacingParent(target: Element) {
        if (!this.detached.size) return false;
        for (
            let parent = target.parentElement;
            parent && parent !== this.root;
            parent = parent.parentElement
        ) {
            if (this.active.get(parent)?.has(replacement)) return true;
        }
        return false;
    }

    private hasActiveDescendant(target: Element) {
        if (!this.active.size || !target.firstElementChild) return false;
        const {SHOW_ELEMENT} = getDomConstructor(target, 'NodeFilter');
        const walker = target.ownerDocument.createTreeWalker(target, SHOW_ELEMENT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (this.active.has(node)) return true;
        }
        return false;
    }
}

function detachContent(
    target: HTMLElement,
    original = target.ownerDocument.createDocumentFragment(),
) {
    const Element = getDomConstructor(target, 'Element');
    for (const node of Array.from(target.childNodes)) {
        // React removes its previous slot during cleanup.
        if (node instanceof Element && node.hasAttribute(VIEWER_SLOT_ATTRIBUTE)) continue;
        original.append(node);
    }
    return original;
}

function belongsToViewer(element: Element, root: HTMLElement) {
    for (let node: Element | null = element; node && node !== root; node = node.parentElement) {
        // The wrapper of a nested viewer starts with its HTML root.
        if (
            node.hasAttribute(VIEWER_SLOT_ATTRIBUTE) ||
            node.firstElementChild?.hasAttribute(VIEWER_ROOT_ATTRIBUTE)
        ) {
            return false;
        }
    }
    return !root.hasAttribute(VIEWER_SLOT_ATTRIBUTE);
}

function inSubtrees(element: Element, roots: Set<Node>) {
    for (let node: Element | null = element; node; node = node.parentElement) {
        if (roots.has(node)) return true;
    }
    return false;
}
