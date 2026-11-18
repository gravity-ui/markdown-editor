import {transform} from '@diplodoc/folding-headings-extension';
import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import type {DOMOutputSpec, TagParseRule} from '@gravity-ui/markdown-editor/pm/model';
import {
    headingLevelAttr,
    headingToMarkdown,
    renderYfmHeadingAttributes,
} from '@gravity-ui/markdown-editor/specs';

import {FoldingHeadingAttr, headingNodeName} from './const';
import {skipSectionsPlugin} from './md/skip-heading-sections';
import {renderFoldingHeadingMarkup} from './utils';

const HEADING_TAG = /^h[1-6]$/;

/** Needs YfmHeadingSpecs before it */
export const FoldingHeadingSpecs: ExtensionAuto = (builder) => {
    builder.configureMd((md) => md.use(transform({bundle: false})).use(skipSectionsPlugin));

    builder.overrideNodeSpec(headingNodeName, (prev) => ({
        ...prev,
        attrs: {
            ...prev.attrs,
            [FoldingHeadingAttr.Folding]: {default: null},
        },
        parseDOM: prev.parseDOM?.map(withFoldingAttr),
        toDOM: (node) => {
            const spec: DOMOutputSpec = prev.toDOM?.(node) ?? [
                'h' + node.attrs[headingLevelAttr],
                0,
            ];
            const folding = node.attrs[FoldingHeadingAttr.Folding];
            return folding === null
                ? spec
                : addDomAttr(spec, `data-${FoldingHeadingAttr.Folding}`, folding);
        },
    }));

    builder.overrideMarkdownTokenParserSpec(headingNodeName, (prev) => ({
        ...prev,
        getAttrs: (token, tokens, index) => {
            const attrs = prev.getAttrs ? prev.getAttrs(token, tokens, index) : prev.attrs;
            if (token.type.endsWith('_close')) return attrs ?? {};

            return {
                ...attrs,
                [FoldingHeadingAttr.Folding]: token.meta?.folding === true ? true : null,
            };
        },
    }));

    builder.overrideNodeSerializerSpec(headingNodeName, () =>
        headingToMarkdown({
            renderMarkup: renderFoldingHeadingMarkup,
            renderAttributes: renderYfmHeadingAttributes,
        }),
    );
};

function withFoldingAttr(rule: TagParseRule): TagParseRule {
    if (!HEADING_TAG.test(rule.tag)) return rule;

    const {getAttrs} = rule;
    return {
        ...rule,
        getAttrs: (dom) => {
            const attrs = getAttrs ? getAttrs(dom) : rule.attrs;
            if (attrs === false) return false;
            return {...attrs, [FoldingHeadingAttr.Folding]: getFoldingAttr(dom)};
        },
    };
}

function getFoldingAttr(dom: HTMLElement): boolean | null {
    const value = dom.getAttribute(`data-${FoldingHeadingAttr.Folding}`);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
}

function addDomAttr(spec: DOMOutputSpec, name: string, value: unknown): DOMOutputSpec {
    if (!Array.isArray(spec)) return spec;

    const [tag, attrs, ...rest] = spec;
    if (isAttrs(attrs)) return [tag, {...attrs, [name]: value}, ...rest];
    return [tag, {[name]: value}, ...spec.slice(1)];
}

function isAttrs(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        (value as {nodeType?: unknown}).nodeType === undefined
    );
}
