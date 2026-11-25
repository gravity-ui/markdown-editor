export class ElementClaims {
    private elements = new WeakMap<Element, Map<string, Set<() => void>>>();

    claim(element: Element, key: string, activate: () => void) {
        let slots = this.elements.get(element);
        if (!slots) {
            slots = new Map();
            this.elements.set(element, slots);
        }
        let queue = slots.get(key);
        if (!queue) {
            queue = new Set();
            slots.set(key, queue);
        }
        queue.add(activate);
        if (queue.size === 1) activate();

        return () => {
            const first = queue.values().next().value;
            if (!queue.delete(activate)) return;
            if (queue.size === 0) slots.delete(key);
            else if (activate === first) queue.values().next().value?.();
        };
    }
}
