export function getTargetZIndex(targetClassName: string, offset = 10) {
    const targetLayerElement = document.querySelector(`.${targetClassName}`);

    if (!targetLayerElement) {
        return offset;
    }

    const computedStyle = window.getComputedStyle(targetLayerElement);
    const targetZIndex = parseInt(computedStyle.zIndex, 10);

    return Number.isFinite(targetZIndex) ? targetZIndex + offset : offset;
}
