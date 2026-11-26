type Setup = () => void | (() => void);

interface Claim {
    setup: Setup;
    cleanup?: ReturnType<Setup>;
    released?: boolean;
}

interface Queue {
    claims: Set<Claim>;
    updating: boolean;
}

export class ElementClaims {
    private elements = new WeakMap<Element, Map<string, Queue>>();

    claim(element: Element, key: string, setup: Setup) {
        let slots = this.elements.get(element);
        if (!slots) {
            slots = new Map();
            this.elements.set(element, slots);
        }
        let queue = slots.get(key);
        if (!queue) {
            queue = {claims: new Set(), updating: false};
            slots.set(key, queue);
        }

        const claim: Claim = {setup};
        queue.claims.add(claim);
        if (queue.claims.size === 1) updateQueue(slots, key);
        return () => {
            claim.released = true;
            if (queue.claims.values().next().value === claim) updateQueue(slots, key);
            else queue.claims.delete(claim);
        };
    }
}

function updateQueue(slots: Map<string, Queue>, key: string) {
    const queue = slots.get(key);
    if (!queue || queue.updating) return;
    queue.updating = true;
    const errors: unknown[] = [];
    for (const claim of queue.claims) {
        try {
            if (!claim.released) claim.cleanup = claim.setup();
            // Setup can release its own claim.
            if (!claim.released) break;
            claim.cleanup?.();
        } catch (error) {
            errors.push(error);
        }
        queue.claims.delete(claim);
    }
    queue.updating = false;
    if (!queue.claims.size) slots.delete(key);
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, 'Viewer claim update failed');
}
