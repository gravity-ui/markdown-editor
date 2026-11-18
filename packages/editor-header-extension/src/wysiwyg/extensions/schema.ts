export const attrSpecs = <T extends object>(defaults: Readonly<T>) =>
    Object.fromEntries(Object.entries(defaults).map(([name, value]) => [name, {default: value}]));
