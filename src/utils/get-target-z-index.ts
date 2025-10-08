export function getTargetZIndex(dataLayoutSelector: string, offset = 10) {
    const targetLayerElement = document.querySelector(`[data-layout="${dataLayoutSelector}"]`);

    if (!targetLayerElement) {
        return offset;
    }

    const computedStyle = window.getComputedStyle(targetLayerElement);
    const targetZIndex = parseInt(computedStyle.zIndex, 10);

    return Number.isFinite(targetZIndex) ? targetZIndex + offset : offset;
}
