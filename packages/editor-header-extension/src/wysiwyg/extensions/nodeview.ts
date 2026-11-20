type DomAttrs = Record<string, string>;

const classNames = (value: string | undefined) => (value ? value.split(' ') : []);

export function syncDomAttrs(dom: HTMLElement, prev: DomAttrs, next: DomAttrs) {
    const {class: prevClass, ...prevAttrs} = prev;
    const {class: nextClass, ...nextAttrs} = next;
    if (prevClass !== nextClass) {
        dom.classList.remove(...classNames(prevClass));
        dom.classList.add(...classNames(nextClass));
    }
    for (const name of Object.keys(prevAttrs)) {
        if (!(name in nextAttrs)) dom.removeAttribute(name);
    }
    for (const [name, value] of Object.entries(nextAttrs)) {
        if (prevAttrs[name] !== value) dom.setAttribute(name, value);
    }
}
