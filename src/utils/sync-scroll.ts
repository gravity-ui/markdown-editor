import React from 'react';

export type CodeLineElement = {el: HTMLElement; line: number};

export function getElementsForSourceLine(
    targetLine: number,
    lines: CodeLineElement[],
): {
    previous: CodeLineElement;
    next?: CodeLineElement;
} {
    const lineNumber = Math.floor(targetLine);
    let previous = lines[0] || null;
    for (const entry of lines) {
        if (entry.line === lineNumber) {
            return {previous: entry, next: undefined};
        } else if (entry.line > lineNumber) {
            return {previous, next: entry};
        }
        previous = entry;
    }
    return {previous};
}

export function getElementBounds({el: element}: CodeLineElement): {
    top: number;
    height: number;
} {
    // Some code line elements may contain other code line elements.
    // In those cases, only take the height up to that child.
    const codeLineChild = element.querySelector(`.line`) as HTMLElement;
    if (codeLineChild) {
        const height = Math.max(1, codeLineChild.offsetTop - element.offsetTop);
        return {
            top: element.offsetTop,
            height,
        };
    }

    return {top: element.offsetTop, height: element.offsetHeight};
}

export function scrollToRevealSourceLine(
    line: number,
    lines: CodeLineElement[],
    outerRef: React.RefObject<HTMLElement>,
) {
    const outer = outerRef.current;
    if (!outer) return;
    if (line <= 0) {
        outer.scroll(outer.scrollLeft, 0);
        return;
    }
    const {previous, next} = getElementsForSourceLine(line, lines);
    if (!previous) {
        return;
    }

    let scrollTo = 0;
    const rect = getElementBounds(previous);
    const previousTop = rect.top;
    if (next && next.line !== previous.line) {
        // Between two elements. Go to percentage offset between them.
        const betweenProgress = (line - previous.line) / (next.line - previous.line);
        const previousEnd = previousTop + rect.height;
        const betweenHeight = next.el.offsetTop - previousEnd;
        scrollTo = previousEnd + betweenProgress * betweenHeight;
    } else {
        const progressInElement = line - Math.floor(line);
        scrollTo = previousTop + rect.height * progressInElement;
    }
    scrollTo = Math.abs(scrollTo) < 1 ? Math.sign(scrollTo) : scrollTo;
    outer.scroll(outer.scrollLeft, Math.max(1, scrollTo));
}

export function getEditorLineNumberForOffset(
    offset: number,
    lines: CodeLineElement[],
    outerRef: React.RefObject<HTMLElement>,
): number | null {
    if (!outerRef.current) return null;
    const {previous, next} = getLineElementsAtPageOffset(offset, lines, outerRef);
    if (previous) {
        if (previous.line < 0) {
            return 0;
        }
        const previousBounds = getElementBounds(previous);
        const offsetFromPrevious = offset - previousBounds.top;
        if (next) {
            const progressBetweenElements =
                offsetFromPrevious / (getElementBounds(next).top - previousBounds.top);
            return previous.line + progressBetweenElements * (next.line - previous.line);
        } else {
            const progressWithinElement = offsetFromPrevious / previousBounds.height;
            return previous.line + progressWithinElement;
        }
    }
    return null;
}

export function getLineElementsAtPageOffset(
    offset: number,
    lines: CodeLineElement[],
    outerRef: React.RefObject<HTMLElement>,
): {
    previous: CodeLineElement | null;
    next?: CodeLineElement;
} {
    const outer = outerRef.current;
    if (!outer) return {previous: null};

    const position = offset;
    let lo = -1;
    let hi = lines.length - 1;
    while (lo + 1 < hi) {
        const mid = Math.floor((lo + hi) / 2);
        const bounds = getElementBounds(lines[mid]);
        if (bounds.top + bounds.height >= position) {
            hi = mid;
        } else {
            lo = mid;
        }
    }
    const hiElement = lines[hi];
    const hiBounds = getElementBounds(hiElement);
    if (hi >= 1 && hiBounds.top > position) {
        const loElement = lines[lo];
        return {previous: loElement, next: hiElement};
    }
    if (hi > 1 && hi < lines.length && hiBounds.top + hiBounds.height > position) {
        return {previous: hiElement, next: lines[hi + 1]};
    }
    return {previous: hiElement};
}
