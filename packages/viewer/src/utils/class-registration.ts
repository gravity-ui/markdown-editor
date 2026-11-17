type OwnerChange = (isOwner: boolean) => void;

export function createClassRegistration(className: string) {
    const queues = new WeakMap<Element, OwnerChange[]>();

    return function register(element: Element | null, onOwnerChange?: OwnerChange) {
        if (!element) return undefined;

        const queue = queues.get(element) ?? [];
        const isFirst = queue.length === 0;
        if (isFirst) {
            if (element.classList.contains(className)) {
                onOwnerChange?.(false);
                return undefined;
            }
            element.classList.add(className);
            queues.set(element, queue);
        }

        const notifyOwner = (isOwner: boolean) => onOwnerChange?.(isOwner);
        queue.push(notifyOwner);
        notifyOwner(isFirst);

        return () => {
            const index = queue.indexOf(notifyOwner);
            if (index < 0) return;
            queue.splice(index, 1);
            if (index > 0) return;

            const [nextOwner] = queue;
            if (nextOwner) {
                nextOwner(true);
            } else {
                queues.delete(element);
                element.classList.remove(className);
            }
        };
    };
}
