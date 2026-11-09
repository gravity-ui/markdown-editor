import type {ExtensionAuto, SerializerNodeToken} from '@gravity-ui/markdown-editor/core';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {pType} from '@gravity-ui/markdown-editor/specs';
import {
    headerContentTokenName,
    headerDimensions,
    headerTitleDefaults,
    headerTitleTokenName,
    normalizeHeaderTitleAttrs,
} from '@gravity-ui/markdown-plugin-header';

import {headerContentNodeName, headerNodeName, headerTitleNodeName} from './const';

/** A visible title or description with one empty paragraph and default attributes is skipped. */
function isEmptySlot(node: Node) {
    const {name} = node.type;
    const {firstChild} = node;
    if (name !== headerTitleNodeName && name !== headerContentNodeName) return false;
    if (node.attrs.hidden || node.childCount !== 1) return false;
    if (firstChild?.type !== pType(node.type.schema) || firstChild.childCount) return false;
    if (name === headerContentNodeName) return true;
    const {size, color} = normalizeHeaderTitleAttrs(node.attrs);
    return size === headerTitleDefaults.size && color === headerTitleDefaults.color;
}

function titleOpening(node: Node) {
    const {size, color} = normalizeHeaderTitleAttrs(node.attrs);
    const attrs: string[] = [];
    if (size !== headerTitleDefaults.size) attrs.push(`size="${size}"`);
    if (color !== headerTitleDefaults.color) attrs.push(`color="${color}"`);
    return `:::${headerTitleTokenName}${attrs.length ? `{${attrs.join(' ')}}` : ''}`;
}

const serializeSlot =
    (opening: (node: Node) => string): SerializerNodeToken =>
    (state, node) => {
        state.write(opening(node));
        state.ensureNewLine();
        state.renderContent(node);
        state.flushClose(1);
        state.write(':::');
        state.closeBlock(node);
    };

export const HeaderSerializerSpecs: ExtensionAuto = (builder) => {
    builder
        .addNodeSerializerSpec(headerNodeName, () => (state, node) => {
            const {height, width} = headerDimensions(node.attrs);
            const attrs = [`height="${height}"`, `width="${width}"`];
            node.forEach((child) => {
                if (!child.attrs.hidden) return;
                if (child.type.name === headerTitleNodeName) attrs.push('title="false"');
                if (child.type.name === headerContentNodeName) attrs.push('description="false"');
            });
            state.write(`:::header{${attrs.join(' ')}}`);
            state.ensureNewLine();
            state.closeBlock(node);
            node.forEach((child, _offset, index) => {
                if (!isEmptySlot(child)) state.render(child, node, index);
            });
            state.write(':::');
            state.closeBlock(node);
        })
        .addNodeSerializerSpec(headerTitleNodeName, () => serializeSlot(titleOpening))
        .addNodeSerializerSpec(
            headerContentNodeName,
            () => serializeSlot(() => `:::${headerContentTokenName}`),
        );
};
