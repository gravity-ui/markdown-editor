const DEFAULT_OFFSET = 10;

export function getTargetZIndex(
    dataLayoutSelector: string,
    offset = DEFAULT_OFFSET,
): number | undefined {
    const targetLayerElement = document.querySelector(`[data-layout="${dataLayoutSelector}"]`);

    if (!targetLayerElement) {
        return undefined;
    }

    const computedStyle = window.getComputedStyle(targetLayerElement);
    const targetZIndex = parseInt(computedStyle.zIndex, 10);

    if (!Number.isFinite(targetZIndex) || targetZIndex <= 0) {
        return undefined;
    }

    return targetZIndex + offset;
}
