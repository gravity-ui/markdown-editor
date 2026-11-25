type Setup = () => void | (() => void);

interface Claim {
    setup: Setup;
    cleanup?: ReturnType<Setup>;
}

interface Queue {
    claims: Set<Claim>;
    active?: Claim;
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

        const claim = {setup};
        queue.claims.add(claim);
        updateQueue(slots, key);
        return () => {
            if (queue.claims.delete(claim)) updateQueue(slots, key);
        };
    }
}

function updateQueue(slots: Map<string, Queue>, key: string) {
    const queue = slots.get(key);
    if (!queue || queue.updating) return;
    queue.updating = true;
    const errors: unknown[] = [];
    // Read the queue again after each user callback.
    while (true) {
        const next = queue.claims.values().next().value;
        const previous = queue.active;
        if (previous === next) break;
        if (previous) {
            queue.active = undefined;
            try {
                previous.cleanup?.();
            } catch (error) {
                errors.push(error);
            }
        } else if (next) {
            queue.active = next;
            try {
                next.cleanup = next.setup();
            } catch (error) {
                queue.claims.delete(next);
                errors.push(error);
            }
        }
    }
    queue.updating = false;
    if (!queue.claims.size) slots.delete(key);
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, 'Viewer claim update failed');
}
