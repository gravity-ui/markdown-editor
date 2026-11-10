export function getTopOffset(elem: Element) {
    const TOOLBAR_HEIGHT = 36; //px
    const TOOLBAR_BOTTOM_OFFSET = 8; // px
    const TOOLBAR_TOP_ADDITIONAL_OFFSET = 8; // px
    const TOOLBAR_TOP_OFFSET_VAR = '--g-md-toolbar-sticky-offset';

    const topOffsetValue = window.getComputedStyle(elem).getPropertyValue(TOOLBAR_TOP_OFFSET_VAR);
    const toolbarTopOffset =
        calculateCSSNumberValue(topOffsetValue) + TOOLBAR_TOP_ADDITIONAL_OFFSET;

    return toolbarTopOffset + TOOLBAR_HEIGHT + TOOLBAR_BOTTOM_OFFSET;
}

function calculateCSSNumberValue(cssValue: string): number {
    const tmp = document.createElement('div');
    tmp.style.position = 'absolute';
    tmp.style.top = '-99999px';
    tmp.style.left = '-99999px';
    tmp.style.width = `calc(${cssValue})`;

    document.body.appendChild(tmp);
    const value = tmp.getBoundingClientRect().width;
    tmp.remove();

    return value;
}
