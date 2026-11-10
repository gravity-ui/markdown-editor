export function getDomConstructor<Name extends keyof typeof globalThis>(
    element: Element,
    name: Name,
): (typeof globalThis)[Name] {
    return element.ownerDocument.defaultView?.[name] ?? globalThis[name];
}
