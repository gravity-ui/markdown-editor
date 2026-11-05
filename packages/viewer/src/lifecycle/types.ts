export interface ViewerEffectContext {
    readonly root: HTMLDivElement;
    readonly signal: AbortSignal;
}

export type ViewerEffectCleanup = () => void;

export type ViewerEffect = (context: ViewerEffectContext) => void | ViewerEffectCleanup;
