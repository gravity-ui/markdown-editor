import type {Text} from '@codemirror/state';
import {FILE_TOKEN} from '@diplodoc/file-extension';
import type {SyntaxNode, Tree} from '@lezer/common';
import {normalizeReference, unescapeAll} from 'markdown-it/lib/common/utils';

import {DirectiveSyntaxFacet} from '../../../markup/codemirror/directive-facet';

import type {
    CodeMirrorResourceHandler,
    ResourceDefinition,
    ResourceLinkCodec,
    ResourceSourceRange,
    ResourceSyntaxContext,
} from './handlers';

// Markdown destinations decode entities; legacy file attributes store the URL literally.
const markdownDestination = (value: string) => value.replace(/&/g, '&amp;');

function destinationRange(
    node: SyntaxNode,
    read: (from: number, to: number) => string,
): ResourceSourceRange {
    return read(node.from, node.from + 1) === '<'
        ? {from: node.from + 1, to: node.to - 1}
        : {from: node.from, to: node.to};
}

/** Strip Markdown delimiters from an image label while preserving its visible content. */
function imageLabel(
    node: SyntaxNode,
    from: number,
    to: number,
    read: (from: number, to: number) => string,
) {
    const omitted: ResourceSourceRange[] = [];
    const visit = (item: SyntaxNode) => {
        if (item.from < from || item.to > to) return;
        if (/Mark$/.test(item.name)) omitted.push({from: item.from, to: item.to});
        else for (let child = item.firstChild; child; child = child.nextSibling) visit(child);
    };
    for (let child = node.firstChild; child; child = child.nextSibling) visit(child);
    let value = '';
    let pos = from;
    for (const range of omitted) {
        value += read(pos, range.from);
        pos = range.to;
    }
    return unescapeAll(value + read(pos, to));
}

export const imageResourceHandler: CodeMirrorResourceHandler = {
    nodeType: 'image',
    valueAttribute: 'src',
    syntaxNodes: ['Image', 'SizedResourceImage'],
    read({node, doc, definitions, urls}) {
        const read = (from: number, to: number) => doc.sliceString(from, to);
        const marks = node.getChildren('LinkMark');
        const labelNode = node.getChild('ResourceLabel');
        const labelFrom = labelNode?.from ?? node.from + 2;
        const labelTo = labelNode ? labelNode.to + 1 : marks[1]?.to;
        if (labelTo === undefined) return undefined;
        const label = imageLabel(node, labelFrom, labelTo - 1, read);
        const url = node.getChild('URL') ?? node.getChild('ResourceURL');
        if (url) {
            const range = destinationRange(url, read);
            const value = urls.normalizeLink(unescapeAll(read(range.from, range.to)));
            if (!urls.validateLink(value)) return undefined;
            return {
                range: {from: node.from, to: node.to},
                valueRange: range,
                serialize: markdownDestination,
                attrs: {src: value, alt: label},
            };
        }
        const ref = node.getChild('LinkLabel');
        const id = ref ? read(ref.from + 1, ref.to - 1) : '';
        const definition = definitions.get(normalizeReference(id || read(labelFrom, labelTo - 1)));
        if (!definition) return undefined;
        return {
            range: {from: node.from, to: node.to},
            valueRange: definition.valueRange,
            serialize: markdownDestination,
            attrs: {src: definition.value, alt: label},
            reference: {labelTo, title: definition.title, definitionRange: definition.range},
        };
    },
};

export const fileResourceHandler: CodeMirrorResourceHandler = {
    nodeType: FILE_TOKEN,
    valueAttribute: 'href',
    syntaxNodes: ['ResourceFile', 'ResourceFileDirective'],
    read({node, doc, urls, state}: ResourceSyntaxContext) {
        const mode = state.facet(DirectiveSyntaxFacet)?.valueFor('yfmFile') ?? 'disabled';
        const directive = node.name === 'ResourceFileDirective';
        if (directive ? mode === 'disabled' : mode === 'only') return undefined;
        const url = node.getChild('FileResourceURL'),
            name = node.getChild('FileResourceName');
        if (!url || !name) return undefined;
        const range = destinationRange(url, (from, to) => doc.sliceString(from, to));
        const raw = doc.sliceString(range.from, range.to);
        const value = urls.normalizeLink(directive ? unescapeAll(raw) : raw);
        if (!urls.validateLink(value)) return undefined;
        return {
            range: {from: node.from, to: node.to},
            valueRange: range,
            serialize: directive ? markdownDestination : (prepared) => prepared,
            attrs: {href: value, download: doc.sliceString(name.from, name.to)},
        };
    },
};

/** Markdown link definitions contain URLs, independently of custom resource values. */
export function collectReferenceDefinitions(tree: Tree, doc: Text, urls: ResourceLinkCodec) {
    const definitions = new Map<string, ResourceDefinition>();
    tree.iterate({
        enter({node}) {
            if (['FencedCode', 'CodeBlock', 'InlineCode', 'Monospace'].includes(node.name))
                return false;
            // Definitions are block nodes; paragraph/heading inline content cannot contain them.
            if (node.name !== 'LinkReference') return !node.type.is('LeafBlock');
            const label = node.getChild('LinkLabel'),
                url = node.getChild('URL');
            if (!label || !url) return false;
            const id = normalizeReference(doc.sliceString(label.from + 1, label.to - 1));
            if (definitions.has(id)) return false;
            const range = destinationRange(url, (from, to) => doc.sliceString(from, to));
            const value = urls.normalizeLink(unescapeAll(doc.sliceString(range.from, range.to)));
            if (!urls.validateLink(value)) return false;
            const title = node.getChild('LinkTitle');
            definitions.set(id, {
                range: {from: node.from, to: node.to},
                valueRange: range,
                value,
                title: title
                    ? unescapeAll(doc.sliceString(title.from + 1, title.to - 1))
                    : undefined,
            });
            return false;
        },
    });
    return definitions;
}
