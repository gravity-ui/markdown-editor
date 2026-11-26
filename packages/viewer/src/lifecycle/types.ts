export type AfterCommit = (callback: () => void) => void;

export interface ViewerEffectContext {
    /** Element containing the viewer's rendered HTML. */
    readonly root: HTMLDivElement;
    /** Aborted when this effect run stops. */
    readonly signal: AbortSignal;
    /** Queues synchronous setup and cleanup by element and key. Returns a release function. */
    readonly claim: (
        element: Element,
        key: string,
        setup: () => void | ViewerEffectCleanup,
    ) => ViewerEffectCleanup;
}

export type ViewerEffectCleanup = () => void;

export type ViewerEffect = (context: ViewerEffectContext) => void | ViewerEffectCleanup;
