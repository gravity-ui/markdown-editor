import {useClientLayoutEffect} from '../utils/use-client-layout-effect';

export function useTargetClass(target: HTMLElement, className: string) {
    useClientLayoutEffect(() => {
        if (target.classList.contains(className)) return undefined;

        target.classList.add(className);
        return () => target.classList.remove(className);
    }, [target, className]);
}
