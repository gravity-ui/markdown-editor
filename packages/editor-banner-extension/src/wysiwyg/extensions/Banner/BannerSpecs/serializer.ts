import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    bannerBackground,
    bannerBackgroundValues,
    bannerDimensions,
    bannerLayout,
    bannerLayoutValues,
} from '@gravity-ui/markdown-plugin-banner';

import {directiveAttrs} from '../../../utils/directive';
import {isButton, isButtonRow} from '../../Button/ButtonSpecs';

import {bannerNodeName} from './const';

function buttonRows(node: Node): Node[] {
    if (!isButtonRow(node)) return [node];
    const rows: Node[][] = [[]];
    node.forEach((child, _offset, index) => {
        if (index > 0 && isButton(child) && isButton(node.child(index - 1))) rows.push([]);
        rows[rows.length - 1].push(child);
    });
    return rows.map((row) => node.type.create(node.attrs, row, node.marks));
}

export const BannerSerializerSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSerializerSpec(bannerNodeName, () => (state, node) => {
        const attrs = {
            ...bannerDimensions(node.attrs),
            ...bannerLayoutValues(bannerLayout(node.attrs)),
            ...bannerBackgroundValues(bannerBackground(node.attrs)),
        };
        state.write(`:::banner${directiveAttrs(attrs)}`);
        state.ensureNewLine();
        state.closeBlock(node);
        node.forEach((child, _offset, index) => {
            for (const row of buttonRows(child)) state.render(row, node, index);
        });
        state.write(':::');
        state.closeBlock(node);
    });
};
