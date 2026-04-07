import type {ExtensionAuto} from '#core';
import {
    type HeadingSpecsOptions,
    headingToMarkdown,
} from 'src/extensions/markdown/Heading/HeadingSpecs';

import {YfmHeadingAttr, headingNodeName} from './const';
import {headingIdsPlugin} from './markdown/heading-ids';
import {getNodeAttrs, renderYfmHeadingAttributes, renderYfmHeadingMarkup} from './utils';

export {YfmHeadingAttr} from './const';
export {renderYfmHeadingAttributes, renderYfmHeadingMarkup} from './utils';

export type YfmHeadingSpecsOptions = HeadingSpecsOptions & {};

/** YfmHeading extension needs markdown-it-attrs plugin */
export const YfmHeadingSpecs: ExtensionAuto<YfmHeadingSpecsOptions> = (builder, _opts) => {
    builder.configureMd((md) => md.use(headingIdsPlugin));

    builder.overrideNodeSpec(headingNodeName, (prev) => ({
        ...prev,
        attrs: {
            ...prev.attrs,
            [YfmHeadingAttr.Id]: {default: ''},
            [YfmHeadingAttr.Folding]: {default: null},
        },
        selectable: true,
        parseDOM: [
            {tag: 'h1', getAttrs: getNodeAttrs(1), priority: 100, consuming: true},
            {tag: 'h2', getAttrs: getNodeAttrs(2), priority: 100, consuming: true},
            {tag: 'h3', getAttrs: getNodeAttrs(3), priority: 100, consuming: true},
            {tag: 'h4', getAttrs: getNodeAttrs(4), priority: 100, consuming: true},
            {tag: 'h5', getAttrs: getNodeAttrs(5), priority: 100, consuming: true},
            {tag: 'h6', getAttrs: getNodeAttrs(6), priority: 100, consuming: true},
            {
                // ignore anchor link inside headings
                tag: 'a.yfm-anchor',
                context: `${headingNodeName}/`,
                skip: true,
                ignore: true,
                priority: 1000,
            },
        ],
        toDOM(node) {
            const id = node.attrs[YfmHeadingAttr.Id];
            const lineNumber = node.attrs[YfmHeadingAttr.DataLine];
            const folding = node.attrs[YfmHeadingAttr.Folding];
            return [
                'h' + node.attrs[YfmHeadingAttr.Level],
                {
                    id: id || null,
                    [YfmHeadingAttr.DataLine]: lineNumber,
                    [`data-${YfmHeadingAttr.Folding}`]: folding,
                },
                0,
                // [
                //     'a',
                //     {
                //         href: `#${node.attrs[YfmHeadingAttr.Id]}`,
                //         class: 'yfm-anchor',
                //         'aria-hidden': 'true',
                //         contenteditable: 'false',
                //     },
                // ],
                // ['span', 0],
            ];
        },
    }));

    builder.overrideMarkdownTokenParserSpec(headingNodeName, (prev) => ({
        ...prev,
        getAttrs: (token) => {
            if (token.type.endsWith('_close')) return {};

            const attrs = Object.fromEntries(token.attrs || []);
            // if (!attrs[YfmHeadingAttr.Id]) {
            //     // calculate id if it was not specified
            //     // tokens[index + 1] is child inline token
            //     attrs[YfmHeadingAttr.Id] = slugify(tokens[index + 1].content);
            // }

            // attrs have id only if it explicitly specified manually
            return {
                [YfmHeadingAttr.Level]: Number(token.tag.slice(1)),
                [YfmHeadingAttr.Folding]: token.meta?.folding === true ? true : null,
                ...attrs,
            };
        },
    }));

    builder.overrideNodeSerializerSpec(headingNodeName, () =>
        headingToMarkdown({
            renderMarkup: renderYfmHeadingMarkup,
            renderAttributes: renderYfmHeadingAttributes,
        }),
    );
};
