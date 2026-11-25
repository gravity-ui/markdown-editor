import type {ViewerEffectContext} from '../../src';

export function shouldAcceptSynchronousElementClaims({root, claim}: ViewerEffectContext) {
    const release: () => void = claim(root, 'hide', () => {
        root.setAttribute('hidden', '');
        return () => root.removeAttribute('hidden');
    });
    return release;
}

export function shouldRejectInvalidClaims({root, claim}: ViewerEffectContext) {
    // @ts-expect-error Claim keys are strings.
    claim(root, Symbol(), () => undefined);
    // @ts-expect-error Claim setup must finish before the next claim starts.
    claim(root, 'hide', async () => undefined);
}
