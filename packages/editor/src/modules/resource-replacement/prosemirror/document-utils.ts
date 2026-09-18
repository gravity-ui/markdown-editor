import {Fragment, type Node, Slice} from 'prosemirror-model';

import type {Parser} from '../../../core/types/parser';
import {CheckboxNode} from '../../../extensions/yfm/Checkbox/CheckboxSpecs/const';
import {TabsNode} from '../../../extensions/yfm/YfmTabs/YfmTabsSpecs/const';
import {resourceKey} from '../tracking';
import type {ResourceOccurrence} from '../tracking';
import type {ReplacementResource} from '../types';

export function describeResource(node: Node) {
    const resource = node.type.spec.resource;
    return resource && typeof node.attrs[resource.urlAttribute] === 'string' ? resource : undefined;
}

export class ResourceCollection {
    readonly resources: ReplacementResource[] = [];
    private entries = new Map<string, ReplacementResource>();

    add(kind: ReplacementResource['kind'], path: string, name?: string) {
        const key = resourceKey({kind, path});
        let resource = this.entries.get(key);
        if (!resource) {
            resource = {kind, path, ...(name ? {name} : {})};
            this.entries.set(key, resource);
            this.resources.push(resource);
        }
        return resource;
    }

    mapFragment(
        fragment: Fragment,
        replacements: ReadonlyMap<string, string> = new Map(),
    ): Fragment {
        const nodes: Node[] = [];
        fragment.forEach((node) => {
            if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) {
                nodes.push(node);
                return;
            }
            const description = describeResource(node);
            const attribute = description?.urlAttribute;
            if (description && attribute) {
                const resource = this.add(
                    description.kind,
                    node.attrs[attribute],
                    description.nameAttribute ? node.attrs[description.nameAttribute] : undefined,
                );
                const url = replacements.get(resourceKey(resource));
                if (url !== undefined) {
                    node = node.type.create(
                        {...node.attrs, [attribute]: url},
                        node.content,
                        node.marks,
                    );
                }
            }
            if (node.content.size) node = node.copy(this.mapFragment(node.content, replacements));
            nodes.push(node);
        });
        return Fragment.fromArray(nodes);
    }

    mapSlice(slice: Slice, replacements?: ReadonlyMap<string, string>) {
        return new Slice(
            this.mapFragment(slice.content, replacements),
            slice.openStart,
            slice.openEnd,
        );
    }
}

export function encodeResourceUrl(parser: Parser, url: string) {
    return parser
        .normalizeLink(url)
        .replace(/[\s<>"'()\\]/g, (char) =>
            encodeURIComponent(char).replace(
                /[!'()]/g,
                (value) => `%${value.charCodeAt(0).toString(16).toUpperCase()}`,
            ),
        );
}

export function resourceAttribute(node: Node) {
    return describeResource(node)?.urlAttribute;
}

export function resourceOccurrences(doc: Node): ResourceOccurrence[] {
    const occurrences: ResourceOccurrence[] = [];
    doc.descendants((node) => {
        if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
        const description = describeResource(node);
        const attr = description?.urlAttribute;
        if (description && attr) {
            occurrences.push({kind: description.kind, path: node.attrs[attr]});
        }
        return true;
    });
    return occurrences;
}

/** Tabs and checkboxes regenerate DOM identities; these are not changes to Markdown content. */
export function comparableFragment(fragment: Fragment): Fragment {
    const nodes: Node[] = [];
    fragment.forEach((node) => {
        const attrs = {...node.attrs};
        if (node.type.name === CheckboxNode.Input) attrs.id = null;
        if (node.type.name === CheckboxNode.Label) attrs.for = null;
        if (
            [TabsNode.Tab, TabsNode.RadioTab, TabsNode.TabPanel].includes(
                node.type.name as TabsNode,
            )
        ) {
            for (const key of ['id', 'aria-controls', 'aria-labelledby', 'data-diplodoc-id']) {
                if (key in attrs) attrs[key] = null;
            }
        }
        if (
            [TabsNode.Tabs, TabsNode.RadioTabs].includes(node.type.name as TabsNode) &&
            typeof attrs['data-diplodoc-group'] === 'string' &&
            attrs['data-diplodoc-group'].startsWith('defaultTabsGroup-')
        )
            attrs['data-diplodoc-group'] = 'defaultTabsGroup';
        nodes.push(
            node.isText
                ? node
                : node.type.create(attrs, comparableFragment(node.content), node.marks),
        );
    });
    return Fragment.fromArray(nodes);
}

export function validateResourceUrl(parser: Parser, path: string) {
    const encoded = encodeResourceUrl(parser, path);
    if (!parser.validateLink(path) || !parser.validateLink(encoded))
        throw new Error('Invalid resource URL');
    return encoded;
}

export function mapResourceNodes(fragment: Fragment, map: (node: Node) => Node): Fragment {
    const nodes: Node[] = [];
    fragment.forEach((node) => {
        if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) {
            nodes.push(node);
            return;
        }
        if (resourceAttribute(node)) node = map(node);
        if (node.content.size) node = node.copy(mapResourceNodes(node.content, map));
        nodes.push(node);
    });
    return Fragment.fromArray(nodes);
}
