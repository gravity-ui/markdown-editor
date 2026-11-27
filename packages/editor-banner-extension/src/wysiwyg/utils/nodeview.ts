import {changedAttrs} from './attrs';

type DomAttrs = Record<string, string>;

const classNames = (value: string | undefined) => new Set(value?.split(' ').filter(Boolean));

// The element keeps the classes that the editor adds to a selected node.
export function syncDomAttrs(dom: HTMLElement, prev: DomAttrs, next: DomAttrs) {
    const {class: prevClass, ...prevAttrs} = prev;
    const {class: nextClass, ...nextAttrs} = next;
    if (prevClass !== nextClass) {
        const prevClasses = classNames(prevClass);
        const nextClasses = classNames(nextClass);
        dom.classList.remove(...[...prevClasses].filter((name) => !nextClasses.has(name)));
        dom.classList.add(...[...nextClasses].filter((name) => !prevClasses.has(name)));
    }
    for (const name of Object.keys(prevAttrs)) {
        if (!(name in nextAttrs)) dom.removeAttribute(name);
    }
    for (const [name, value] of changedAttrs(prevAttrs, nextAttrs)) dom.setAttribute(name, value);
}
