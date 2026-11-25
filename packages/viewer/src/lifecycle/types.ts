export interface ViewerEffectContext {
    readonly root: HTMLDivElement;
    readonly signal: AbortSignal;
    /** Queue a setup for this element and key. Release it early or let the effect release it. */
    readonly claim: (
        element: Element,
        key: string,
        setup: () => void | ViewerEffectCleanup,
    ) => ViewerEffectCleanup;
}

export type ViewerEffectCleanup = () => void;

export type ViewerEffect = (context: ViewerEffectContext) => void | ViewerEffectCleanup;
