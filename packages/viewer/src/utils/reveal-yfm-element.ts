import {getDomConstructor} from './dom-constructor';
import {inspectViewerNode} from './inspect-viewer-node';

export type RevealYfmTarget =
    | Element
    | {id: string; selector?: never}
    | {selector: string; id?: never};

export interface RevealYfmElementOptions {
    /** Limit lookup and ancestor traversal to this root, including the root itself. */
    root?: Element;
}

/**
 * Reveal YFM containers around a target. Tab selection needs the application's runtime.
 * Return the processed element, or null if it is missing, outside the root, or in a slot.
 * A returned element may still be hidden by other styles or a missing tabs runtime.
 */
export function revealYfmElement(
    target: RevealYfmTarget | null,
    {root}: RevealYfmElementOptions = {},
): Element | null {
    if (!target) return null;
    const element = resolveTarget(target, root);
    if (!element) return null;

    const ancestors = [element];
    let scope = element;
    while (scope !== root && scope.parentElement) {
        scope = scope.parentElement;
        ancestors.push(scope);
    }
    if (root && scope !== root) return null;

    for (const container of ancestors.reverse()) {
        if (!container.contains(element) || inspectViewerNode(scope, element).kind !== 'content') {
            return null;
        }
        revealContainer(container, element, scope);
    }
    return inspectViewerNode(scope, element).kind === 'content' ? element : null;
}

function resolveTarget(target: RevealYfmTarget, root?: Element): Element | null {
    if ('nodeType' in target) return target;
    const scope = root ?? (typeof document === 'undefined' ? undefined : document);
    if (!scope) return null;
    if (target.id !== undefined) {
        if (root?.getAttribute('id') === target.id) return root;
        return (
            Array.from(scope.querySelectorAll('[id]')).find((node) => node.id === target.id) ?? null
        );
    }
    return root?.matches(target.selector) ? root : scope.querySelector(target.selector);
}

function revealContainer(container: Element, target: Element, root: Element): void {
    if (container.tagName === 'DETAILS') {
        const summary = container.querySelector(':scope > summary');
        if (!summary?.contains(target)) container.setAttribute('open', '');
    }

    if (container.classList.contains('heading-section')) {
        const heading = container.firstElementChild;
        const targetInHeading =
            heading?.matches('h1, h2, h3, h4, h5, h6') && heading.contains(target);
        if (!targetInHeading) container.classList.add('open');
    }

    if (!container.matches('.yfm-tab-panel:not(.active)')) return;
    const control = findTabControl(container);
    if (!(control instanceof getDomConstructor(container, 'HTMLElement'))) return;
    if (inspectViewerNode(root, control).kind !== 'content') return;
    control.click();
}

function findTabControl(panel: Element): Element | undefined {
    const tabs = panel.parentElement;
    if (!tabs?.classList.contains('yfm-tabs')) return undefined;
    const controls = Array.from(tabs.querySelectorAll('.yfm-tab')).filter(
        (tab) => tab.closest('.yfm-tabs') === tabs,
    );
    if (panel.id) {
        const control = controls.find((tab) => tab.getAttribute('aria-controls') === panel.id);
        if (control) return control;
    }

    const labelledBy = panel.getAttribute('aria-labelledby');
    if (!labelledBy) return undefined;
    return controls.find(
        (tab) => tab.id === labelledBy || tab.getAttribute('data-diplodoc-id') === labelledBy,
    );
}
