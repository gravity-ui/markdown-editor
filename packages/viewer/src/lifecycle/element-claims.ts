type Setup = () => void | (() => void);

interface Entry {
    setup: Setup;
    cleanup?: void | (() => void);
}

interface ClaimQueue {
    entries: Set<Entry>;
    active?: Entry;
    updating: boolean;
}

export class ElementClaims {
    private elements = new WeakMap<Element, Map<string, ClaimQueue>>();

    claim(element: Element, key: string, setup: Setup) {
        let queues = this.elements.get(element);
        if (!queues) {
            queues = new Map();
            this.elements.set(element, queues);
        }

        let queue = queues.get(key);
        if (!queue) {
            queue = {entries: new Set(), updating: false};
            queues.set(key, queue);
        }

        const entry = {setup};
        queue.entries.add(entry);
        updateQueue(queues, key);
        return () => {
            if (queue.entries.delete(entry)) updateQueue(queues, key);
        };
    }
}

function updateQueue(queues: Map<string, ClaimQueue>, key: string) {
    // Setup and cleanup may change this queue again.
    const queue = queues.get(key);
    if (!queue || queue.updating) return;
    queue.updating = true;
    const errors: unknown[] = [];
    while (true) {
        const first = queue.entries.values().next().value;
        if (queue.active === first) break;
        if (queue.active) {
            const {cleanup} = queue.active;
            queue.active = undefined;
            try {
                cleanup?.();
            } catch (error) {
                errors.push(error);
            }
        } else if (first) {
            queue.active = first;
            try {
                first.cleanup = first.setup();
            } catch (error) {
                queue.entries.delete(first);
                errors.push(error);
            }
        }
    }
    queue.updating = false;
    if (queue.entries.size === 0) queues.delete(key);
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, 'Viewer claim update failed');
}
