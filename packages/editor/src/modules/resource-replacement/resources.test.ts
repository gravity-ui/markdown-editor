import {Schema} from 'prosemirror-model';
import {Transform} from 'prosemirror-transform';
import {describe, expect, it} from 'vitest';

import {resourceKey} from './controller.utils';
import {collectRequestedUrlKeys, readNodeResource} from './read-node-resource';
import {replaceNodeResources} from './replace-node-resources';
import {validateResourceSchema} from './schema';
import {defaultResourceUrls} from './tests/urls';

const schema = new Schema({
    nodes: {
        doc: {content: '(image | asset | code_block)*'},
        text: {},
        image: {
            attrs: {src: {}, alt: {default: ''}},
            _resource: {kind: 'asset', valueAttribute: 'src', nameAttribute: 'alt'},
        },
        asset: {
            attrs: {id: {}},
            _resource: {kind: 'asset', valueAttribute: 'id'},
        },
        code_block: {content: 'image*', code: true},
    },
});

describe('shared resource model', () => {
    it('should validate resource attributes before processing the schema', () => {
        expect(() => validateResourceSchema(schema)).not.toThrow();
        const invalid = new Schema({
            nodes: {
                doc: {content: 'asset*'},
                text: {},
                asset: {_resource: {kind: 'asset', valueAttribute: 'missing'}},
            },
        });
        expect(() => validateResourceSchema(invalid)).toThrow('Invalid resource description');
    });

    it('should read names and distinguish URL resources from opaque identifiers', () => {
        const image = readNodeResource(
            schema.nodes.image.create({src: '/old', alt: 'label'}),
            defaultResourceUrls,
        );
        const asset = readNodeResource(
            schema.nodes.asset.create({id: '/old'}),
            defaultResourceUrls,
        );
        expect(image).toEqual({
            resource: {kind: 'asset', value: '/old', name: 'label'},
            isUrl: true,
        });
        expect(asset).toEqual({resource: {kind: 'asset', value: '/old'}, isUrl: false});
        expect(
            readNodeResource(schema.nodes.asset.create({id: 42}), defaultResourceUrls),
        ).toBeUndefined();
        expect(collectRequestedUrlKeys([image!, asset!])).toEqual(
            new Set([resourceKey({kind: 'asset', value: '/old'})]),
        );
    });

    it('should replace current matches without cascading or changing code and opaque values', () => {
        const image = schema.nodes.image.create({src: '/old', alt: 'label'});
        const original = schema.nodes.doc.create(null, [
            image,
            schema.nodes.image.create({src: '/new value'}),
            schema.nodes.asset.create({id: '/old'}),
            schema.nodes.code_block.create(null, image),
        ]);
        const transform = new Transform(original);
        replaceNodeResources(
            transform,
            new Map([
                [resourceKey({kind: 'asset', value: '/old'}), '/new value'],
                [resourceKey({kind: 'asset', value: '/new value'}), '/final'],
            ]),
            defaultResourceUrls,
            new Set(),
        );
        expect(transform.doc.child(0).attrs).toEqual({src: '/new%20value', alt: 'label'});
        expect(transform.doc.child(1).attrs.src).toBe('/final');
        expect(transform.doc.child(2).attrs.id).toBe('/new value');
        expect(transform.doc.child(3).firstChild).toBe(image);
        expect(original.firstChild).toBe(image);
    });

    it('should reject invalid requested URLs even after all matching resources are removed', () => {
        const transform = new Transform(schema.nodes.doc.create());
        const key = resourceKey({kind: 'asset', value: '/old'});
        expect(() =>
            replaceNodeResources(
                transform,
                // eslint-disable-next-line no-script-url
                new Map([[key, 'javascript:alert(1)']]),
                defaultResourceUrls,
                new Set([key]),
            ),
        ).toThrow('Invalid resource URL');
        expect(transform.steps).toEqual([]);
    });
});
