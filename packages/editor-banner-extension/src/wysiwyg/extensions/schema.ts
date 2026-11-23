import type {ExtensionBuilder} from '@gravity-ui/markdown-editor/core';
import type {NodeSpec} from '@gravity-ui/markdown-editor/pm/model';

export const attrSpecs = <T extends object>(defaults: Readonly<T>) =>
    Object.fromEntries(Object.entries(defaults).map(([name, value]) => [name, {default: value}]));

export const placeholderSpec = (
    builder: ExtensionBuilder,
    nodeName: string,
    content: () => string,
): NonNullable<NodeSpec['placeholder']> => ({
    content: builder.context.get('placeholder')?.[nodeName] ?? content,
    alwaysVisible: true,
});
