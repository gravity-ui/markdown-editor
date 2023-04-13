import mathMdPlugin from 'markdown-it-katex';

import type {ExtensionAuto} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';
import {CLASSNAMES, MathNode} from './const';

export {MathNode} from './const';
export const mathIType = nodeTypeFactory(MathNode.Inline);
export const mathBType = nodeTypeFactory(MathNode.Block);

export const MathSpecs: ExtensionAuto = (builder) => {
    builder.configureMd((md) => md.use(mathMdPlugin));
    builder
        .addNode(MathNode.Inline, () => ({
            spec: {
                group: 'inline math',
                content: 'text*',
                inline: true,
                marks: '',
                code: true,
                toDOM: () => [
                    'span',
                    {class: CLASSNAMES.Inline.Container},
                    ['span', {class: CLASSNAMES.Inline.Sharp, contenteditable: 'false'}, '$'],
                    ['span', {class: CLASSNAMES.Inline.Content}, 0],
                    ['span', {class: CLASSNAMES.Inline.Sharp, contenteditable: 'false'}, '$'],
                ],
                parseDOM: [{tag: `span.${CLASSNAMES.Inline.Content}`, priority: 200}],
            },
            fromYfm: {
                tokenName: 'math_inline',
                tokenSpec: {name: MathNode.Inline, type: 'block', noCloseToken: true},
            },
            toYfm: (state, node) => {
                state.text(`$${node.textContent}$`, false);
                state.closeBlock();
            },
        }))
        .addNode(MathNode.Block, () => ({
            spec: {
                group: 'block math',
                content: 'text*',
                marks: '',
                code: true,
                toDOM: () => ['div', {class: 'math-block'}, 0],
                parseDOM: [{tag: 'div.math-block', priority: 200}],
            },
            fromYfm: {
                tokenName: 'math_block',
                tokenSpec: {name: MathNode.Block, type: 'block', noCloseToken: true},
            },
            toYfm: (state, node) => {
                state.text(`$$${node.textContent}$$\n\n`, false);
                state.closeBlock();
            },
        }));
};
