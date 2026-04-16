import {transform} from '@diplodoc/latex-extension';

import type {ExtensionAuto} from '#core';
import {nodeTypeFactory} from 'src/utils/schema';

import {CLASSNAMES, MathNode, MathToken} from './const';

export {MathNode} from './const';
export const mathIType = nodeTypeFactory(MathNode.Inline);
export const mathBType = nodeTypeFactory(MathNode.Block);

export const MathSpecs: ExtensionAuto = (builder) => {
    builder.configureMd((md) => md.use(transform({bundle: false, validate: false}), {output: ''}));

    builder
        .addNodeSpec(MathNode.Inline, () => ({
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
        }))
        .addMarkdownTokenParserSpec(MathToken.Inline, () => ({
            type: 'block',
            name: MathNode.Inline,
            noCloseToken: true,
        }))
        .addNodeSerializerSpec(MathNode.Inline, () => (state, node) => {
            state.text(`$${node.textContent}$`, false);
            state.closeBlock();
        });

    builder
        .addNodeSpec(MathNode.Block, () => ({
            group: 'block math',
            content: 'text*',
            marks: '',
            code: true,
            toDOM: () => ['div', {class: 'math-block'}, 0],
            parseDOM: [{tag: 'div.math-block', priority: 200}],
            selectable: true,
        }))
        .addMarkdownTokenParserSpec(MathToken.Block, () => ({
            type: 'block',
            name: MathNode.Block,
            noCloseToken: true,
        }))
        .addNodeSerializerSpec(MathNode.Block, () => (state, node) => {
            state.text(`$$${node.textContent}$$\n\n`, false);
            state.closeBlock();
        });
};
