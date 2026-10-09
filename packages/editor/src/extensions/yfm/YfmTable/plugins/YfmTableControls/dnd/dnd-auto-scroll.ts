type AutoScrollDirection = 'horizontal' | 'vertical' | 'both';

type AutoScrollOptions = {
    edgeThreshold?: number;
    maxSpeed?: number;
};

const DEFAULT_EDGE_THRESHOLD = 40; // px
const DEFAULT_MAX_SPEED = 15; // px per frame

export class DnDAutoScroller {
    private readonly _container: HTMLElement;
    private readonly _direction: AutoScrollDirection;
    private readonly _edgeThreshold: number;
    private readonly _maxSpeed: number;

    private _clientX = 0;
    private _clientY = 0;
    private _rafId: number | null = null;
    private _active = false;

    constructor(
        scrollContainer: HTMLElement,
        direction: AutoScrollDirection,
        options?: AutoScrollOptions,
    ) {
        this._container = scrollContainer;
        this._direction = direction;
        this._edgeThreshold = options?.edgeThreshold ?? DEFAULT_EDGE_THRESHOLD;
        this._maxSpeed = options?.maxSpeed ?? DEFAULT_MAX_SPEED;
    }

    update(clientX: number, clientY: number): void {
        this._clientX = clientX;
        this._clientY = clientY;

        if (!this._active) {
            this._active = true;
            this._startLoop();
        }
    }

    destroy(): void {
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    private _startLoop(): void {
        const tick = () => {
            this._scrollStep();
            this._rafId = requestAnimationFrame(tick);
        };
        this._rafId = requestAnimationFrame(tick);
    }

    private _getVisibleRect(): {left: number; right: number; top: number; bottom: number} {
        if (this._container === this._container.ownerDocument.documentElement) {
            return {left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight};
        }
        return this._container.getBoundingClientRect();
    }

    private _scrollStep(): void {
        const rect = this._getVisibleRect();
        let dx = 0;
        let dy = 0;

        if (this._direction === 'horizontal' || this._direction === 'both') {
            dx = this._calcDelta(this._clientX, rect.left, rect.right);
        }

        if (this._direction === 'vertical' || this._direction === 'both') {
            dy = this._calcDelta(this._clientY, rect.top, rect.bottom);
        }

        if (dx !== 0 || dy !== 0) {
            this._container.scrollBy(dx, dy);
        }
    }

    /**
     * Returns scroll delta for one axis.
     * Negative when cursor is near the start edge, positive when near the end edge.
     */
    private _calcDelta(cursor: number, edgeStart: number, edgeEnd: number): number {
        const distToStart = cursor - edgeStart;
        const distToEnd = edgeEnd - cursor;

        if (distToStart >= 0 && distToStart < this._edgeThreshold) {
            const ratio = 1 - distToStart / this._edgeThreshold;
            return -Math.round(this._maxSpeed * ratio);
        }

        if (distToEnd >= 0 && distToEnd < this._edgeThreshold) {
            const ratio = 1 - distToEnd / this._edgeThreshold;
            return Math.round(this._maxSpeed * ratio);
        }

        return 0;
    }
}
