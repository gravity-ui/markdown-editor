export function createClassRegistration(className: string) {
    return createElementRegistration((element) => {
        if (element.classList.contains(className)) return undefined;

        element.classList.add(className);
        return () => element.classList.remove(className);
    }).register;
}

type OwnerChange = (isOwner: boolean) => void;

export function createElementRegistration<T extends Element>(
    setup: (element: T) => (() => void) | undefined,
) {
    const registrations = new WeakMap<T, {owners: OwnerChange[]; cleanup: () => void}>();

    return {register, has: (element: T) => registrations.has(element)};

    function register(element: T | null, onOwnerChange?: OwnerChange) {
        if (!element) return undefined;

        let registration = registrations.get(element);
        if (!registration) {
            const cleanup = setup(element);
            if (!cleanup) {
                onOwnerChange?.(false);
                return undefined;
            }
            registration = {owners: [], cleanup};
            registrations.set(element, registration);
        }

        const {owners, cleanup} = registration;
        const notifyOwner = (isOwner: boolean) => onOwnerChange?.(isOwner);
        owners.push(notifyOwner);
        notifyOwner(owners.length === 1);

        return () => {
            const index = owners.indexOf(notifyOwner);
            if (index < 0) return;
            owners.splice(index, 1);

            if (owners.length === 0) {
                registrations.delete(element);
                cleanup();
            } else if (index === 0) {
                owners[0](true);
            }
        };
    }
}
